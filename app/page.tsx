"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toPlainText } from "@/lib/content";
import { supabase } from "@/lib/supabaseClient";
import type { Comment, Post } from "@/lib/types";

const PAGE_SIZE = 12;

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {}
  );
  const [latestComments, setLatestComments] = useState<Comment[]>([]);

  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  async function loadCounts(postIds: string[]) {
    if (postIds.length === 0) return;

    const [{ data: likesData }, { data: commentsData }] = await Promise.all([
      supabase.from("likes").select("post_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
    ]);

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

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("LOAD POSTS ERROR:", error);
      loadingRef.current = false;
      setLoading(false);
      return;
    }

    const nextPosts = data ?? [];

    if (nextPosts.length === 0) {
      setHasMore(false);
      loadingRef.current = false;
      setLoading(false);
      return;
    }

    setPosts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const filtered = nextPosts.filter((p) => !existingIds.has(p.id));
      return [...prev, ...filtered];
    });

    await loadCounts(nextPosts.map((post) => post.id));

    loadingRef.current = false;
    setLoading(false);
  }, [hasMore, page]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadPosts();
    });
  }, [loadPosts]);

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

          setPosts((prev) => {
            if (prev.some((item) => item.id === post.id)) return prev;
            return [post, ...prev];
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
    setLikeCounts((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? 0) + 1,
    }));

    const { error } = await supabase.from("likes").insert({
      post_id: postId,
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
    }
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
      <div className="max-w-7xl mx-auto px-6 py-10 flex gap-8">

        {/* LEFT FEED */}
        <section className="flex-1 min-w-0">
          <header className="mb-8">
            <p className="text-sm text-gray-500 mt-1">
              Stories, thoughts, and ideas.
            </p>
          </header>

          <div className="space-y-4">
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
                    p-6
                    hover:shadow-lg
                    hover:-translate-y-[2px]
                    transition-all duration-300
                    cursor-pointer
                  "
                >
                  <div className="flex justify-between mb-3">
                    <span className="text-xs text-gray-400">
                      @author
                    </span>

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

                  <div className="mt-5 flex gap-5 text-sm text-gray-500">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleLike(post.id);
                      }}
                      className="hover:scale-105 active:scale-95 transition"
                    >
                      ❤️ {getLikes(post.id)}
                    </button>

                    <span>
                      💬 {getComments(post.id)}
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
        <aside className="hidden lg:block w-[320px] shrink-0">
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

            <div className="space-y-4">
              {latestComments.map((comment) => (
                <Link
                  key={comment.id}
                  href={`/post/${comment.post_id}`}
                >
                  <div
                    className="
                      p-3 rounded-2xl
                      hover:bg-black/[0.03]
                      transition
                      cursor-pointer
                    "
                  >
                    <p className="text-sm text-gray-700 line-clamp-3">
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
