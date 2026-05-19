"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toPlainText } from "@/lib/content";
import { supabase } from "@/lib/supabaseClient";
import type { Comment, Post, Profile } from "@/lib/types";

type PostWithProfile = Post & {
  profile?: Pick<Profile, "username" | "avatar_url"> | null;
};

const PAGE_SIZE = 12;

export default function HomePage() {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {}
  );
  const [latestComments, setLatestComments] = useState<Comment[]>([]);

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
    <main className="relative min-h-screen bg-[#f6f4f1] text-[#111827] pt-28 lg:pt-32">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
        <section className="max-w-3xl space-y-6">
          <span className="inline-flex items-center rounded-full border border-black/10 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-gray-600 shadow-sm">
            cinema literar
          </span>

          <h1 className="text-5xl sm:text-6xl font-semibold leading-[0.95] tracking-tight text-[#0f172a]">
            Un spațiu elegant pentru proză, cinema și gânduri lente.
          </h1>

          <p className="max-w-2xl text-lg leading-9 text-slate-600">
            O pagină calmă, cu tipografie rafinată și povestiri care lasă impresie. Mai puține elemente, fiecare atent gândit.
          </p>
        </section>

        <div className="mt-16 grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-8">
            <div className="rounded-[2rem] border border-black/5 bg-white/90 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.06)]">
              <div className="mb-4 text-sm uppercase tracking-[0.2em] text-gray-500">
                Selețiuni recente
              </div>

              {error && (
                <div className="mb-6 rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {likeError && (
                <div className="mb-6 rounded-3xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-700">
                  {likeError}
                </div>
              )}

              <div className="space-y-6">
                {posts.map((post) => (
                  <Link key={post.id} href={`/post/${post.id}`}>
                    <article className="group cursor-pointer rounded-[1.75rem] border border-black/5 bg-[#fcfbf9] p-7 transition duration-300 hover:border-black/10 hover:bg-white">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          {post.profile?.avatar_url ? (
                            <img
                              src={post.profile.avatar_url}
                              alt={post.profile.username ?? "Author avatar"}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
                              ?
                            </div>
                          )}
                          <span className="text-sm text-gray-500">
                            @{post.profile?.username ?? "anonim"}
                          </span>
                        </div>

                        <span className="text-xs uppercase tracking-[0.25em] text-gray-400 opacity-0 transition group-hover:opacity-100">
                          read
                        </span>
                      </div>

                      <h2 className="text-2xl font-semibold leading-tight text-[#111827]">
                        {post.title}
                      </h2>

                      <p className="mt-4 text-base leading-8 text-slate-600 line-clamp-3">
                        {toPlainText(post.content)}
                      </p>

                      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void handleLike(post.id);
                          }}
                          disabled={likingIds.has(post.id) || !currentUserId}
                          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-2 text-sm text-gray-700 hover:bg-black/[0.04] active:scale-95 transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          ❤️
                          <span>{getLikes(post.id)}</span>
                        </button>

                        <span className="inline-flex items-center gap-2">
                          💬
                          <span>{getComments(post.id)}</span>
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              <div ref={observerRef} className="h-10" />

              {loading && (
                <p className="mt-6 text-center text-sm text-gray-400">
                  Loading...
                </p>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-black/5 bg-white/90 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.06)]">
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-500 mb-5">
                Latest comments
              </h2>

              <div className="space-y-4">
                {latestComments.map((comment) => (
                  <Link key={comment.id} href={`/post/${comment.post_id}`}>
                    <div className="cursor-pointer rounded-3xl border border-black/5 bg-[#faf8f5] p-5 transition hover:border-black/10 hover:bg-white">
                      <p className="text-sm leading-7 text-slate-700 line-clamp-2">
                        {toPlainText(comment.content)}
                      </p>
                      <span className="mt-3 block text-xs uppercase tracking-[0.24em] text-gray-400">
                        View discussion →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
