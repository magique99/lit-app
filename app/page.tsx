"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { htmlToPlainTextWithNewlines } from "@/lib/content";
import { supabase } from "@/lib/supabaseClient";
import type { Comment, Post, Profile, Like, LikeInsert } from "@/lib/types";

type PostWithProfile = Post & {
  profile?: Pick<Profile, "username" | "avatar_url"> | null;
  likesCount?: number;
  commentsCount?: number;
  text_type?: string | null;
  genre?: string | null;
  uses_ai?: boolean | null;
};

const PAGE_SIZE = 5;

const TEXT_TYPES = ["Toate", "Proză", "Poezie", "Teatru", "Jurnal"];
const GENRES = [
  "Toate",
  "Ficțiune",
  "Non-ficțiune",
  "SF",
  "Thriller",
  "Polițist",
  "Romantic",
];

export default function HomePage() {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {},
  );
  const [latestComments, setLatestComments] = useState<Comment[]>([]);
  const [topVotedPosts, setTopVotedPosts] = useState<PostWithProfile[]>([]);
  const [topViewedPosts, setTopViewedPosts] = useState<PostWithProfile[]>([]);
  const [filterType, setFilterType] = useState("");
  const [filterGenre, setFilterGenre] = useState("");

  const totalLikes = useMemo(
    () => Object.values(likeCounts).reduce((sum, count) => sum + count, 0),
    [likeCounts],
  );

  const authorsCount = useMemo(() => {
    return new Set(posts.map((p) => p.user_id).filter(Boolean)).size;
  }, [posts]);

  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  async function loadCounts(postIds: string[]) {
    if (postIds.length === 0) return;

    const [
      { data: likesData, error: likesError },
      { data: commentsData, error: commentsError },
    ] = await Promise.all([
      supabase.from("likes").select("post_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
    ]);

    if (likesError || commentsError) {
      throw likesError ?? commentsError;
    }

    const nextLikes: Record<string, number> = {};
    const nextComments: Record<string, number> = {};

    for (const id of postIds) {
      nextLikes[id] = 0;
      nextComments[id] = 0;
    }

     for (const like of likesData ?? []) {
       const postId = (like as { post_id: string }).post_id;
       nextLikes[postId] = (nextLikes[postId] ?? 0) + 1;
     }

     for (const comment of commentsData ?? []) {
       const postId = (comment as { post_id: string }).post_id;
       nextComments[postId] = (nextComments[postId] ?? 0) + 1;
     }

    setLikeCounts((prev) => ({ ...prev, ...nextLikes }));
    setCommentCounts((prev) => ({ ...prev, ...nextComments }));
  }

  // =========================
  // POSTS
  // =========================
  const loadPosts = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to) as any;

    if (filterType && filterType !== "Toate") {
      query = query.eq("text_type", filterType);
    }
    if (filterGenre && filterGenre !== "Toate") {
      query = query.eq("genre", filterGenre);
    }

    const { data, error } = await query;

    if (error) {
      console.error("LOAD POSTS ERROR:", error);
      setError("Nu am putut încărca postările. Încearcă din nou.");
      loadingRef.current = false;
      setLoading(false);
      return;
    }

    const nextPosts = (data ?? []) as PostWithProfile[];

    const userIds = Array.from(
      new Set(
        nextPosts.map((post) => post.user_id).filter(Boolean) as string[],
      ),
    );

     let profileMap: Record<
       string,
       Pick<Profile, "username" | "avatar_url">
     > = {};

     if (userIds.length > 0) {
       const { data: profilesData, error: profilesError } = await supabase
         .from("profiles")
         .select("user_id, username, avatar_url")
         .in("user_id", userIds);

       if (!profilesError && profilesData) {
         const typedProfilesData = profilesData as Array<{ user_id: string; username: string; avatar_url: string | null }>;
         profileMap = typedProfilesData.reduce(
           (map, profile) => ({
             ...map,
             [profile.user_id]: {
               username: profile.username,
               avatar_url: profile.avatar_url,
             },
           }),
           {},
         );
       }
     }

    const nextPostsWithProfile: PostWithProfile[] = nextPosts.map((post) => ({
      ...post,
      profile: post.user_id ? (profileMap[post.user_id] ?? null) : null,
    }));

    if (nextPostsWithProfile.length === 0) {
      setHasMore(false);
      loadingRef.current = false;
      setLoading(false);
      return;
    }

    setPosts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const filtered = nextPostsWithProfile.filter(
        (p) => !existingIds.has(p.id),
      );
      return [...prev, ...filtered];
    });

    try {
      await loadCounts(nextPosts.map((post) => post.id));
    } catch (err) {
      console.error("LOAD COUNTS ERROR:", err);
      setError(
        "Postările s-au încărcat, dar nu am putut actualiza statisticile.",
      );
    }

    loadingRef.current = false;
    setLoading(false);
  }, [hasMore, page, filterType, filterGenre]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadPosts();
    });
  }, [loadPosts]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const handleFilterChange = (type: string | null, genre: string | null) => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    if (type) setFilterType(type);
    if (genre) setFilterGenre(genre);
  };

  async function loadTopPosts() {
    // Fetch posts with aggregated likes/comments arrays, but don't rely on a
    // DB relationship to `profiles` because the foreign-key may not exist.
    const { data, error } = await supabase
      .from("posts")
      .select("*, likes(id), comments(id)");

    if (error) {
      console.error("LOAD TOP POSTS ERROR:", error);
      return;
    }

    if (!data) return;

    // Collect user_ids to fetch profile info in a second query
    const userIds = Array.from(
      new Set(data.map((p: any) => p.user_id).filter(Boolean) as string[]),
    );

    let profileMap: Record<
      string,
      Pick<Profile, "username" | "avatar_url">
    > = {};

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

     if (!profilesError && profilesData) {
         profileMap = profilesData.reduce(
           (map: any, p: any) => ({
             ...map,
             [p.user_id as string]: { username: p.username as string, avatar_url: p.avatar_url as string | null },
           }),
           {},
         );
       }
    }

    const postsWithCounts: PostWithProfile[] = data.map((post: any) => ({
      ...post,
      profile: post.user_id ? (profileMap[post.user_id] ?? null) : null,
      likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
      commentsCount: Array.isArray(post.comments) ? post.comments.length : 0,
    }));

    const sortedByLikes = [...postsWithCounts].sort(
      (a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0),
    );
    const sortedByComments = [...postsWithCounts].sort(
      (a, b) => (b.commentsCount ?? 0) - (a.commentsCount ?? 0),
    );

    setTopVotedPosts(sortedByLikes.slice(0, 3));
    setTopViewedPosts(sortedByComments.slice(0, 3));
  }

  useEffect(() => {
    void loadTopPosts();
  }, []);

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) {
        console.error("LOAD LATEST COMMENTS ERROR:", error);
        setError("Nu am putut încărca ultimele comentarii.");
        return;
      }

      setLatestComments(data ?? []);
    }

    load();
  }, []);

  // =========================
  // REALTIME POSTS
  // =========================
  useEffect(() => {
    const channel = supabase
      .channel("realtime-posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          const post = payload.new as Post;
          const postWithProfile: PostWithProfile = {
            ...post,
            profile: null,
          };

          setPosts((prev) => {
            if (prev.some((item) => item.id === post.id)) return prev;
            return [postWithProfile, ...prev];
          });
          setLikeCounts((prev) => ({ ...prev, [post.id]: 0 }));
          setCommentCounts((prev) => ({ ...prev, [post.id]: 0 }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================
  // REALTIME COMMENTS
  // =========================
  useEffect(() => {
    const channel = supabase
      .channel("realtime-comments")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
        },
        (payload) => {
          const comment = payload.new as Comment;

          setCommentCounts((prev) => ({
            ...prev,
            [comment.post_id]: (prev[comment.post_id] ?? 0) + 1,
          }));
          setLatestComments((prev) => [comment, ...prev].slice(0, 8));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================
  // INFINITE SCROLL
  // =========================
  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage((p) => p + 1);
        }
      },
      {
        rootMargin: "200px",
      },
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [loading, hasMore]);

  // =========================
  // OPTIMISTIC LIKE
  // =========================
  async function handleLike(postId: string) {
    if (!currentUserId) {
      setLikeError("Trebuie să fii conectat pentru a da like.");
      return;
    }

    if (likingIds.has(postId)) return;

    setLikeError(null);
    setLikingIds((prev) => new Set(prev).add(postId));
    setLikeCounts((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? 0) + 1,
    }));

     const { error } = await supabase
       .from("likes")
       .insert({
         post_id: postId,
         user_id: currentUserId,
       } as LikeInsert);
  }

  // =========================
  // HELPERS
  // =========================
  const getLikes = (postId: string) => {
    return likeCounts[postId] ?? 0;
  };

  const getComments = (postId: string) => commentCounts[postId] ?? 0;

  return (
    <main className="relative min-h-screen bg-[#f7efe4] text-slate-950 pt-8 lg:pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       <section className="relative overflow-hidden rounded-[3rem] bg-[#fcf5ec] text-slate-950 shadow-[0_60px_120px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70">
         <div className="relative min-h-[20vh] sm:min-h-[25vh] lg:min-h-[35vh] max-h-[620px]">
           <Image
             src="/Literatura9-1.png"
             alt="Literatura banner"
             fill
             priority
             className="object-cover object-center opacity-90"
           />

           <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-[#f8efe4]/40 to-[#f1e2d5]/90" />
           <div className="absolute inset-0 flex items-center">
             <div className="max-w-4xl px-6 py-10 sm:px-10 lg:px-16">
               {/* stats grid moved below hero to appear after the banner */}
             </div>
           </div>
         </div>
       </section>


          {/* Stats grid: moved here so it appears after the banner */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-[#fffdf8] hover:shadow-[0_20px_40px_rgba(251,191,36,0.1)]">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Texte recente
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
                {posts.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-[#fffdf8] hover:shadow-[0_20px_40px_rgba(56,189,248,0.1)]">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Comentarii recente
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
                {latestComments.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-emerald-300/40 hover:bg-[#fffdf8] hover:shadow-[0_20px_40px_rgba(16,185,129,0.1)]">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Reacții
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
                {totalLikes}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-violet-300/40 hover:bg-[#fffdf8] hover:shadow-[0_20px_40px_rgba(139,92,246,0.1)]">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Autori
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
                {authorsCount}
              </p>
            </div>
          </div>


        {/* FILTERS */}
        <div className="mt-8 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Tip text
              </p>
              <div className="flex flex-wrap gap-2">
                {TEXT_TYPES.map((t) => {
                  const isActive = (filterType || "Toate") === t;
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setFilterType(t === "Toate" ? "" : t);
                        setPage(0);
                        setPosts([]);
                        setHasMore(true);
                      }}
                      className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                        isActive
                          ? "bg-amber-400 text-slate-950"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Gen
              </p>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => {
                  const isActive = (filterGenre || "Toate") === g;
                  return (
                    <button
                      key={g}
                      onClick={() => {
                        setFilterGenre(g === "Toate" ? "" : g);
                        setPage(0);
                        setPosts([]);
                        setHasMore(true);
                      }}
                      className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                        isActive
                          ? "bg-amber-400 text-slate-950"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

         <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
           <section className="space-y-6">
             <div className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
               <div className="mb-3 text-xs sm:text-sm uppercase tracking-[0.22em] text-slate-500">
                 Ultimele postări
               </div>

              {error && (
                <div className="mb-6 rounded-3xl border border-rose-200/60 bg-rose-50/80 px-5 py-4 text-sm text-rose-700">
                  {error}
                </div>
              )}

              {likeError && (
                <div className="mb-6 rounded-3xl border border-amber-200/70 bg-amber-50/80 px-5 py-4 text-sm text-amber-700">
                  {likeError}
                </div>
              )}

              <div className="space-y-[10px] py-[10px] sm:space-y-[16px] sm:py-[16px] lg:space-y-[20px] lg:py-[20px]">
{posts.map((post, index) => (
  <Link key={post.id} href={`/post/${post.id}`}>
    <article className="group cursor-pointer overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:border-slate-300/80">
           <div className="p-4 sm:p-6 lg:p-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-3">
              <img
                src={post.profile?.avatar_url ?? "/user.jpg"}
                alt={post.profile?.username ?? "Author avatar"}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  @{post.profile?.username ?? "anonim"}
                </p>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Autor
                </p>
              </div>
            </div>
           <h2 className="text-lg font-semibold leading-none text-slate-950 lg:text-xl">
               {post.title}
             </h2>
          </div>

           <Link
             href={`/post/${post.id}`}
             className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-amber-300"
           >
             Citește acum
           </Link>
        </div>

         <p
           className={`mt-3 text-sm leading-6 text-slate-600 ${index < PAGE_SIZE ? 'line-clamp-2' : 'line-clamp-3'} max-w-xs sm:max-w-sm lg:max-w-md`}
           style={{ whiteSpace: "pre-line" }}
         >
           {htmlToPlainTextWithNewlines(post.content)}
         </p>

         <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500 sm:mt-5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleLike(post.id);
            }}
            disabled={likingIds.has(post.id) || !currentUserId}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 active:scale-95 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            ❤️
            <span>{getLikes(post.id)}</span>
          </button>

          <span className="inline-flex items-center gap-2">
            💬<span>{getComments(post.id)}</span>
          </span>
        </div>
      </div>
    </article>
  </Link>
))}
              </div>

              <div ref={observerRef} className="h-10" />

              {loading && (
                <p className="mt-6 text-center text-sm text-slate-500">
                  Loading...
                </p>
              )}
            </div>
          </section>

           <aside className="space-y-6">
             <div className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
               <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.24em] text-slate-600 mb-4">
                 Ultimele comentarii
               </h2>

              <div className="space-y-3 py-[10px]">
                {latestComments.slice(0, 3).map((comment) => (
                  <Link key={comment.id} href={`/post/${comment.post_id}`}>
                    <div className="cursor-pointer rounded-3xl border border-slate-200 bg-[#fef8f1] p-4 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                      <p
                        className="text-sm leading-7 text-slate-700 line-clamp-2"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {htmlToPlainTextWithNewlines(comment.content)}
                      </p>
                      <span className="mt-2 block text-xs uppercase tracking-[0.24em] text-slate-500">
                        Vezi comentariul →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600 mb-5">
                Top texte
              </h2>

               <div className="space-y-6">
                 <div>
                   <div className="mb-3 text-xs sm:text-xs uppercase tracking-[0.2em] text-slate-500">
                     Cele mai votate
                   </div>

                  <div className="space-y-3 py-[10px]">
                    {topVotedPosts.length === 0 ? (
                      <div className="text-sm text-gray-400">
                        Nu sunt încă date.
                      </div>
                    ) : (
                      topVotedPosts.slice(0, 3).map((post) => (
                        <Link key={post.id} href={`/post/${post.id}`}>
                          <div className="cursor-pointer rounded-3xl border border-slate-200/80 bg-slate-50 p-4 transition duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:bg-white hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                            <div className="text-sm font-semibold text-slate-900">
                              {post.title}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                              {post.text_type && <span>{post.text_type}</span>}
                              {post.genre && <span>• {post.genre}</span>}
                              {post.uses_ai && <span>• AI</span>}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {post.likesCount ?? getLikes(post.id)} voturi
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                 <div>
                   <div className="mb-3 text-xs sm:text-xs uppercase tracking-[0.2em] text-gray-500">
                     Cele mai vizualizate
                   </div>

                  <div className="space-y-3 py-[10px]">
                    {topViewedPosts.length === 0 ? (
                      <div className="text-sm text-gray-400">
                        Nu sunt încă date.
                      </div>
                    ) : (
                      topViewedPosts.slice(0, 3).map((post) => (
                        <Link key={post.id} href={`/post/${post.id}`}>
                          <div className="cursor-pointer rounded-3xl border border-slate-200/80 bg-slate-50 p-4 transition duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:bg-white hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                            <div className="text-sm font-semibold text-slate-900">
                              {post.title}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                              {post.text_type && <span>{post.text_type}</span>}
                              {post.genre && <span>• {post.genre}</span>}
                              {post.uses_ai && <span>• AI</span>}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {post.commentsCount ?? getComments(post.id)}{" "}
                              vizualizări
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
