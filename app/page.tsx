"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toPlainText } from "@/lib/content";
import { supabase } from "@/lib/supabaseClient";
import type { Comment, Post, Profile } from "@/lib/types";

type PostWithProfile = Post & {
  profile?: Pick<Profile, "username" | "avatar_url"> | null;
  likesCount?: number;
  commentsCount?: number;
};

const PAGE_SIZE = 12;

export default function HomePage() {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {}
  );
  const [latestComments, setLatestComments] = useState<Comment[]>([]);
  const [topVotedPosts, setTopVotedPosts] = useState<PostWithProfile[]>([]);
  const [topViewedPosts, setTopViewedPosts] = useState<PostWithProfile[]>([]);

  const totalLikes = useMemo(
    () => Object.values(likeCounts).reduce((sum, count) => sum + count, 0),
    [likeCounts]
  );

  const featuredPost = topVotedPosts[0] ?? null;

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
      nextLikes[like.post_id] = (nextLikes[like.post_id] ?? 0) + 1;
    }

    for (const comment of commentsData ?? []) {
      nextComments[comment.post_id] = (nextComments[comment.post_id] ?? 0) + 1;
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

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("LOAD POSTS ERROR:", error);
      setError("Nu am putut încărca postările. Încearcă din nou.");
      loadingRef.current = false;
      setLoading(false);
      return;
    }

    const nextPosts = data ?? [];

    const userIds = Array.from(
      new Set(nextPosts.map((post) => post.user_id).filter(Boolean) as string[])
    );

    let profileMap: Record<string, Pick<Profile, "username" | "avatar_url">> = {};

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      if (!profilesError && profilesData) {
        profileMap = profilesData.reduce(
          (map, profile) => ({
            ...map,
            [profile.user_id]: {
              username: profile.username,
              avatar_url: profile.avatar_url,
            },
          }),
          {}
        );
      }
    }

    const nextPostsWithProfile: PostWithProfile[] = nextPosts.map(
      (post) => ({
        ...post,
        profile: post.user_id ? profileMap[post.user_id] ?? null : null,
      })
    );

    if (nextPostsWithProfile.length === 0) {
      setHasMore(false);
      loadingRef.current = false;
      setLoading(false);
      return;
    }

    setPosts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const filtered = nextPostsWithProfile.filter(
        (p) => !existingIds.has(p.id)
      );
      return [...prev, ...filtered];
    });

    try {
      await loadCounts(nextPosts.map((post) => post.id));
    } catch (err) {
      console.error("LOAD COUNTS ERROR:", err);
      setError("Postările s-au încărcat, dar nu am putut actualiza statisticile.");
    }

    loadingRef.current = false;
    setLoading(false);
  }, [hasMore, page]);

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

  async function loadTopPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select(
        "*, profiles(username, avatar_url), likes(id), comments(id)"
      );

    if (error) {
      console.error("LOAD TOP POSTS ERROR:", error);
      return;
    }

    if (!data) return;

    const postsWithCounts: PostWithProfile[] = data.map((post: any) => ({
      ...post,
      profile: post.profiles
        ? {
            username: post.profiles.username,
            avatar_url: post.profiles.avatar_url,
          }
        : null,
      likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
      commentsCount: Array.isArray(post.comments) ? post.comments.length : 0,
    }));

    const sortedByLikes = [...postsWithCounts].sort(
      (a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0)
    );
    const sortedByComments = [...postsWithCounts].sort(
      (a, b) => (b.commentsCount ?? 0) - (a.commentsCount ?? 0)
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
        }
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
        }
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
        if (
          entries[0].isIntersecting &&
          !loading &&
          hasMore
        ) {
          setPage((p) => p + 1);
        }
      },
      {
        rootMargin: "200px",
      }
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

    const { error } = await supabase.from("likes").insert({
      post_id: postId,
      user_id: currentUserId,
    });

    if (error) {
      console.error("LIKE ERROR:", error);

      setLikeCounts((prev) => ({
        ...prev,
        [postId]: Math.max(
          (prev[postId] ?? 1) - 1,
          0
        ),
      }));

      if (error.code !== "23505") {
        setLikeError("Like-ul nu a putut fi salvat.");
      }
    }

    setLikingIds((prev) => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  }

  // =========================
  // HELPERS
  // =========================
  const getLikes = (postId: string) => {
    return likeCounts[postId] ?? 0;
  };

  const getComments = (postId: string) =>
    commentCounts[postId] ?? 0;


  return (
    <main className="relative min-h-screen bg-[#080b12] text-slate-100 pt-8 lg:pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[3rem] bg-slate-950 text-white shadow-[0_60px_120px_rgba(15,23,42,0.24)] ring-1 ring-white/10">
          <div className="relative h-[420px] sm:h-[520px] lg:h-[620px]">
            <Image
              src="/Literatura9.png"
              alt="Literatura banner"
              fill
              priority
              className="object-cover object-center opacity-90"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/30 to-slate-950/80" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-4xl px-6 py-10 sm:px-10 lg:px-16">
                <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
                  Editură digitală</span>

                <h1 className="mt-8 text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[0.95] tracking-[-0.03em] text-white">
                  O poveste vizuală, o experiență literară premium.
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200/90 sm:text-lg">
                  Descoperă texte selectate, sugestii poetice și ritmuri cinematice într-un spațiu calm, modern și rafinat.
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/10 hover:shadow-[0_25px_60px_rgba(251,191,36,0.16)]">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Colecții active</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{posts.length}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/10 hover:shadow-[0_25px_60px_rgba(56,189,248,0.14)]">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Comentarii recente</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{latestComments.length}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-emerald-300/40 hover:bg-white/10 hover:shadow-[0_25px_60px_rgba(16,185,129,0.14)]">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Reacții</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{totalLikes}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {featuredPost && (
          <section className="mt-12 rounded-[2.5rem] border border-white/10 bg-slate-950/95 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.2)] backdrop-blur-xl">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <span className="inline-flex rounded-full border border-slate-700/50 bg-slate-900/80 px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-300">
                  Alegerea curatorului</span>
                <div>
                  <h2 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                    {featuredPost.title}
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                    {toPlainText(featuredPost.content)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 text-center">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Autor</p>
                  <p className="mt-3 text-xl font-semibold text-white">@{featuredPost.profile?.username ?? "anonim"}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 text-center">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Voturi</p>
                  <p className="mt-3 text-xl font-semibold text-white">{featuredPost.likesCount ?? getLikes(featuredPost.id)}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 text-center">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Vizualizări</p>
                  <p className="mt-3 text-xl font-semibold text-white">{featuredPost.commentsCount ?? getComments(featuredPost.id)}</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 lg:mt-0 lg:justify-end">
                <Link href={`/post/${featuredPost.id}`} className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_60px_rgba(251,191,36,0.24)] transition hover:bg-amber-300">
                  Citește acum
                </Link>
                <Link href="/create" className="inline-flex items-center justify-center rounded-full border border-amber-400/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  Adaugă un text
                </Link>
              </div>
            </div>
          </section>
        )}

        <div className="mt-16 grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-8">
            <div className="rounded-[2.5rem] border border-white/10 bg-white/95 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="mb-4 text-sm uppercase tracking-[0.22em] text-slate-500">
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

              <div className="space-y-6">
                {posts.map((post) => (
                  <Link key={post.id} href={`/post/${post.id}`}>
                    <article className="group cursor-pointer overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:border-slate-300/80">
                      <div className="p-7">
                        <div className="flex items-center justify-between gap-4 mb-4">
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

                          <span className="text-xs uppercase tracking-[0.3em] text-slate-400 opacity-0 transition group-hover:opacity-100">
                            Read
                          </span>
                        </div>

                        <h2 className="text-2xl font-semibold leading-tight text-slate-950">
                          {post.title}
                        </h2>

                        <p className="mt-4 text-base leading-8 text-slate-600 line-clamp-3">
                          {toPlainText(post.content)}
                        </p>

                        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
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
                            💬
                            <span>{getComments(post.id)}</span>
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

          <aside className="space-y-8">
            <div className="rounded-[2.5rem] border border-slate-800/60 bg-slate-950/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.16)]">
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 mb-5">
                Ultimele comentarii
              </h2>

              <div className="space-y-4">
                {latestComments.map((comment) => (
                  <Link key={comment.id} href={`/post/${comment.post_id}`}>
                    <div className="cursor-pointer rounded-3xl border border-slate-800/50 bg-slate-900/80 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600/60 hover:bg-slate-900/95 hover:shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
                      <p className="text-sm leading-7 text-slate-200 line-clamp-2">
                        {toPlainText(comment.content)}
                      </p>
                      <span className="mt-3 block text-xs uppercase tracking-[0.24em] text-slate-500">
                        Vezi comentariul →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-white/10 bg-white/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.16)]">
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-500 mb-5">
                Top texte
              </h2>

              <div className="space-y-8">
                <div>
                  <div className="mb-4 text-sm uppercase tracking-[0.2em] text-slate-500">
                    Cele mai votate
                  </div>

                  <div className="space-y-3">
                    {topVotedPosts.length === 0 ? (
                      <div className="text-sm text-gray-400">
                        Nu sunt încă date.
                      </div>
                    ) : (
                      topVotedPosts.map((post) => (
                        <Link key={post.id} href={`/post/${post.id}`}>
                          <div className="cursor-pointer rounded-3xl border border-slate-200/80 bg-slate-50 p-4 transition duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:bg-white hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                            <div className="text-sm font-semibold text-slate-900">
                              {post.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {post.likesCount ?? getLikes(post.id)} voturi
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-4 text-sm uppercase tracking-[0.2em] text-gray-500">
                    Cele mai vizualizate
                  </div>

                  <div className="space-y-3">
                    {topViewedPosts.length === 0 ? (
                      <div className="text-sm text-gray-400">
                        Nu sunt încă date.
                      </div>
                    ) : (
                      topViewedPosts.map((post) => (
                        <Link key={post.id} href={`/post/${post.id}`}>
                          <div className="cursor-pointer rounded-3xl border border-slate-200/80 bg-slate-50 p-4 transition duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:bg-white hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                            <div className="text-sm font-semibold text-slate-900">
                              {post.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {post.commentsCount ?? getComments(post.id)} vizualizări
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
