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
      setLikeError("Like-ul nu a putut fi salvat.");
      setLikeCounts((prev) => ({
        ...prev,
        [postId]: Math.max(
          (prev[postId] ?? 1) - 1,
          0
        ),
      }));
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
    <main className="min-h-screen bg-[#f4f4f2] text-[#1f1f1f]">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col lg:flex-row gap-8">

        {/* LEFT FEED */}
        <section className="flex-1 min-w-0">
          <header className="mb-8">
            <p className="text-sm text-gray-500 mt-1">
              Stories, thoughts, and ideas.
            </p>
          </header>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {likeError && (
            <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {likeError}
            </div>
          )}

          {!loading && posts.length === 0 && !error && (
            <div className="rounded-3xl border border-black/5 bg-white/80 p-8 text-sm text-gray-500">
              Nu există postări încă.
            </div>
          )}

          <div className="space-y-4 sm:space-y-5">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
              >
                <article
                  className="
                    group bg-white/90
                    rounded-3xl
                    border border-black/5
                    shadow-sm
                    p-6
                    hover:shadow-lg
                    hover:-translate-y-[2px]
                    transition-all duration-300
                    cursor-pointer
                  "
                >
                  <div className="flex items-center justify-between mb-3 gap-3">
                    <div className="flex items-center gap-3">
                      {post.profile?.avatar_url ? (
                        <img
                          src={post.profile.avatar_url}
                          alt={post.profile.username ?? "Author avatar"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                          ?
                        </div>
                      )}

                      <span className="text-xs text-gray-400">
                        @{post.profile?.username ?? "anonim"}
                      </span>
                    </div>

                    <span
                      className="
                        text-xs text-gray-300
                        opacity-0
                        group-hover:opacity-100
                        transition
                      "
                    >
                      read →
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold mb-2 leading-tight">
                    {post.title}
                  </h2>

                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {toPlainText(post.content)}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-500">
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

          <div
            ref={observerRef}
            className="h-10"
          />

          {loading && (
            <p className="text-center text-sm text-gray-400 py-6">
              Loading...
            </p>
          )}
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="w-full md:w-[320px] shrink-0">
          <div
            className="
              sticky top-24
              bg-white/80
              backdrop-blur-xl
              rounded-3xl
              border border-black/5
              p-5
              shadow-sm
            "
          >
            <h2 className="font-semibold text-sm mb-4">
              💬 Latest comments
            </h2>

            <div className="space-y-3">
              {latestComments.map((comment) => (
                <Link
                  key={comment.id}
                  href={`/post/${comment.post_id}`}
                >
                  <div
                    className="
                      p-4 rounded-2xl
                      border border-black/5
                      hover:bg-black/[0.03]
                      transition
                      cursor-pointer
                    "
                  >
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {toPlainText(comment.content)}
                    </p>

                    <span className="text-xs text-gray-400 mt-2 block">
                      View discussion →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}
