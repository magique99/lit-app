"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { htmlToPlainTextWithNewlines } from "@/lib/content";
import { supabase } from "@/lib/supabaseClient";
import type { Comment, Post, Profile, LikeInsert } from "@/lib/types";

type PostWithProfile = Post & {
  profile?: Pick<Profile, "username" | "avatar_url"> | null;
  likesCount?: number;
  commentsCount?: number;
  text_type?: string | null;
  genre?: string | null;
  uses_ai?: boolean | null;
  likes?: { id: string }[] | null;
  comments?: { id: string }[] | null;
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

export default function TextePage() {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const totalLikes = useMemo(
    () => Object.values(likeCounts).reduce((sum, count) => sum + count, 0),
    [likeCounts],
  );

  const authorsCount = useMemo(() => {
    return new Set(posts.map((p) => p.user_id).filter(Boolean)).size;
  }, [posts]);

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

  const ensureProfiles = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;

    const { data: existingProfiles, error: checkError } = await supabase
      .from("profiles")
      .select("user_id")
      .in("user_id", userIds);

    if (checkError) {
      console.error("CHECK PROFILES ERROR:", checkError);
      return;
    }

    const existingIds = new Set(existingProfiles?.map((p) => p.user_id) ?? []);
    const missingUserIds = userIds.filter((id) => !existingIds.has(id));

    if (missingUserIds.length > 0) {
      console.log("Missing profiles for:", missingUserIds);
      const profilesToCreate = missingUserIds.map((uid) => ({
        user_id: uid,
        username: `user_${uid.slice(0, 8)}`,
      }));
      const { error: insertError } = await supabase
        .from("profiles")
        .insert(profilesToCreate);
      if (insertError) console.error("CREATE PROFILES ERROR:", insertError);
    }
  }, []);

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
      .range(from, to);

    if (filterType && filterType !== "Toate") {
      query = query.eq("text_type", filterType);
    }
    if (filterGenre && filterGenre !== "Toate") {
      query = query.eq("genre", filterGenre);
    }
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
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
        nextPosts.map((post: PostWithProfile) => post.user_id).filter(Boolean) as string[],
      ),
    );

    await ensureProfiles(userIds);

    let profileMap: Record<
      string,
      Pick<Profile, "username" | "avatar_url">
    > = {};

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      console.log("PROFILES QUERY - requested:", userIds.length, "got:", profilesData?.length ?? 0);

      if (profilesError) {
        console.error("LOAD PROFILES ERROR:", profilesError);
      } else if (profilesData) {
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
  }, [ensureProfiles, hasMore, page, filterType, filterGenre, searchQuery]);

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


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPosts([]);
    setPage(0);
    setHasMore(true);
  };

  const loadTopPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*, likes(id), comments(id)");

    if (error) {
      console.error("LOAD TOP POSTS ERROR:", error);
      return;
    }

    if (!data) return;

    const userIds = Array.from(
      new Set(
        (data as PostWithProfile[]).map((p) => p.user_id).filter(Boolean) as string[],
      ),
    );

    await ensureProfiles(userIds);

    let profileMap: Record<
      string,
      Pick<Profile, "username" | "avatar_url">
    > = {};

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      console.log(
        "TOP POSTS - PROFILES QUERY - requested:",
        userIds.length,
        "got:",
        profilesData?.length ?? 0,
      );

      if (profilesError) {
        console.error("LOAD TOP POSTS PROFILES ERROR:", profilesError);
      } else if (profilesData) {
        const typedProfilesData = profilesData as Array<{
          user_id: string;
          username: string;
          avatar_url: string | null;
        }>;
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

    if (userIds.length > 0 && Object.keys(profileMap).length === 0) {
      console.warn("No profiles found for userIds:", userIds);
    }

    const postsWithCounts: PostWithProfile[] = (data as PostWithProfile[]).map((post) => ({
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
  }, [ensureProfiles, setTopVotedPosts, setTopViewedPosts]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadTopPosts();
    });
  }, [loadTopPosts]);

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
          let profileData = null;
          if (post.user_id) {
            (async () => {
              try {
                const { data: profileDataResult, error } = await supabase
                  .from("profiles")
                  .select("username, avatar_url")
                  .eq("user_id", post.user_id)
                  .single();
                if (!error && profileDataResult) {
                  profileData = {
                    username: profileDataResult.username,
                    avatar_url: profileDataResult.avatar_url,
                  };
                }
              } catch (err) {
                console.error("Error fetching profile for realtime post:", err);
              }
            })();
          }
          const postWithProfile: PostWithProfile = {
            ...post,
            profile: profileData,
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

    if (!error) {
      const { data: postData } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (postData && postData.user_id && postData.user_id !== currentUserId) {
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: postData.user_id,
            actor_id: currentUserId,
            post_id: postId,
            type: "like_post",
          });
        if (notifError) {
          console.error("NOTIFICATION ERROR:", notifError);
        } else {
          console.log("NOTIFICATION CREATED for user:", postData.user_id);
        }
      }
    }
  }

  const getLikes = (postId: string) => {
    return likeCounts[postId] ?? 0;
  };

  const getComments = (postId: string) => commentCounts[postId] ?? 0;

  return (
    <main className="min-h-screen" style={{ background: "#faf8f5" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-24">

        {/* ── PAGE LABEL ── */}
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-12">
          Texte
        </p>

        {/* ── SEARCH ── */}
        <div className="mb-14">
          <input
            type="text"
            placeholder="Caută după titlu sau conținut…"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white/60 px-5 py-3.5 text-[15px] text-slate-800 placeholder:text-slate-300 focus:border-slate-400 focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        {/* ── FILTER TAGS ── */}
        <div className="mb-5">
          <div className="flex flex-wrap gap-2">
            {TEXT_TYPES.map((t) => {
              const active = (filterType || "Toate") === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    setFilterType(t === "Toate" ? "" : t);
                    setPage(0); setPosts([]); setHasMore(true);
                  }}
                  className={`
                    rounded-full px-4 py-[6px] text-[12px] font-medium tracking-wide
                    transition-colors duration-150
                    ${active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100/70 text-slate-500 hover:bg-slate-200/70 hover:text-slate-700"
                    }
                  `}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-16">
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => {
              const active = (filterGenre || "Toate") === g;
              return (
                <button
                  key={g}
                  onClick={() => {
                    setFilterGenre(g === "Toate" ? "" : g);
                    setPage(0); setPosts([]); setHasMore(true);
                  }}
                  className={`
                    rounded-full px-4 py-[6px] text-[12px] font-medium tracking-wide
                    transition-colors duration-150
                    ${active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100/70 text-slate-500 hover:bg-slate-200/70 hover:text-slate-700"
                    }
                  `}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── LIVE STATS ── */}
        <div className="grid grid-cols-4 gap-px rounded-2xl overflow-hidden mb-20 bg-slate-200/60">
          {[
            { label: "Texte",   value: posts.length },
            { label: "Comentarii", value: latestComments.length },
            { label: "Reacții", value: totalLikes },
            { label: "Autori",  value: authorsCount },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white/40 px-4 py-6 text-center"
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-1.5">
                {label}
              </p>
              <p className="text-2xl font-light text-slate-800 tabular-nums">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── ERRORS ── */}
        {error && (
          <p className="mb-10 text-sm text-rose-500/80">{error}</p>
        )}
        {likeError && (
          <p className="mb-10 text-sm text-amber-600/80">{likeError}</p>
        )}

        {/* ── POSTS LIST ── */}
        <section className="mb-28">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-10">
            Ultimele postări
          </p>

          <div className="flex flex-col">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group py-8 first:pt-0 last:pb-0"
              >
                <div className="flex items-start gap-5">

                  {/* avatar */}
                  <Link
                    href={post.user_id ? `/profile/${post.user_id}` : "#"}
                    className="mt-0.5 shrink-0"
                  >
                    <Image
                      src={post.profile?.avatar_url ?? "/user.jpg"}
                      alt={post.profile?.username ?? "author"}
                      width={34}
                      height={34}
                      className="rounded-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                  </Link>

                  {/* content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      {post.profile?.username ? (
                        <Link
                          href={`/profile/${post.user_id}`}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          @{post.profile.username}
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          anonim
                        </span>
                      )}
                    </div>

                    <Link href={`/post/${post.id}`}>
                      <h2 className="text-[17px] font-medium text-slate-900 leading-snug mb-2 group-hover:text-slate-600 transition-colors">
                        {post.title}
                      </h2>
                    </Link>

                    <p
                      className="text-[13px] leading-relaxed text-slate-400 max-w-xl mb-4"
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {htmlToPlainTextWithNewlines(post.content).slice(0, 220)}
                      {htmlToPlainTextWithNewlines(post.content).length > 220 ? "…" : ""}
                    </p>

                    <div className="flex items-center gap-5 text-[11px] text-slate-300">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          void handleLike(post.id);
                        }}
                        disabled={likingIds.has(post.id) || !currentUserId}
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <span>♥</span>
                        <span className="tabular-nums">{getLikes(post.id)}</span>
                      </button>

                      <Link
                        href={`/post/${post.id}#comments`}
                        scroll
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-500"
                      >
                        <span>✦</span>
                        <span className="tabular-nums">{getComments(post.id)}</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* divider */}
                <div className="mt-8 border-b border-slate-100/80 last:border-none" />
              </article>
            ))}
          </div>

          <div ref={observerRef} className="h-4" />

          {loading && posts.length > 0 && (
            <p className="mt-10 text-center text-[12px] text-slate-300 tracking-wider uppercase">
              Încărcare…
            </p>
          )}
        </section>

        {/* ── ASIDE ── */}
        <aside className="space-y-16">

          {/* Latest comments */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-8">
              Ultimele comentarii
            </p>
            <div className="flex flex-col gap-1">
              {latestComments.slice(0, 3).map((comment) => (
                <Link
                  key={comment.id}
                  href={`/post/${comment.post_id}#comment-${comment.id}`}
                  className="group/link block py-5 border-b border-slate-100/80 last:border-none"
                >
                  <p
                    className="text-[13px] leading-relaxed text-slate-400 group-hover/link:text-slate-600 transition-colors line-clamp-2"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {htmlToPlainTextWithNewlines(comment.content)}
                  </p>
                  <p className="mt-2 text-[10px] text-slate-300 group-hover/link:text-slate-400 transition-colors">
                    Vezi comentariul →
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-slate-100" />

          {/* Top posts */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-8">
              Top texte
            </p>

            {/* most voted */}
            <div className="mb-10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300 mb-4">
                Cele mai votate
              </p>
              <div className="flex flex-col gap-1">
                {topVotedPosts.length === 0 ? (
                  <p className="text-[12px] text-slate-300 py-3">
                    Nu sunt încă date.
                  </p>
                ) : (
                  topVotedPosts.slice(0, 3).map((post, idx) => {
                    const rankColor = ["text-amber-500/50", "text-slate-400/50", "text-amber-700/30"];
                    return (
                      <Link
                        key={post.id}
                        href={`/post/${post.id}`}
                        className="group/link flex items-start gap-3 py-4 border-b border-slate-100/70 last:border-none"
                      >
                        <span className={`text-[13px] font-light mt-0.5 shrink-0 tabular-nums ${rankColor[idx]}`}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-slate-600 group-hover/link:text-slate-900 transition-colors leading-snug">
                            {post.title}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-300">
                            {post.text_type && <span>{post.text_type}</span>}
                            {post.genre && <span>· {post.genre}</span>}
                            {post.uses_ai && <span>· AI</span>}
                          </div>
                          <p className="mt-1 text-[10px] text-slate-300 tabular-nums">
                            {post.likesCount ?? getLikes(post.id)} voturi
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* most commented */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300 mb-4">
                Cele mai comentate
              </p>
              <div className="flex flex-col gap-1">
                {topViewedPosts.length === 0 ? (
                  <p className="text-[12px] text-slate-300 py-3">
                    Nu sunt încă date.
                  </p>
                 ) : (
                  topViewedPosts.slice(0, 3).map((post, idx) => {
                    const rankColor2 = ["text-amber-500/50", "text-slate-400/50", "text-amber-700/30"];
                    return (
                      <Link
                        key={post.id}
                        href={`/post/${post.id}`}
                        className="group/link flex items-start gap-3 py-4 border-b border-slate-100/70 last:border-none"
                      >
                        <span className={`text-[13px] font-light mt-0.5 shrink-0 tabular-nums ${rankColor2[idx]}`}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-slate-600 group-hover/link:text-slate-900 transition-colors leading-snug">
                            {post.title}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-300">
                            {post.text_type && <span>{post.text_type}</span>}
                            {post.genre && <span>· {post.genre}</span>}
                            {post.uses_ai && <span>· AI</span>}
                          </div>
                          <p className="mt-1 text-[10px] text-slate-300 tabular-nums">
                            {post.commentsCount ?? getComments(post.id)} replies
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}
