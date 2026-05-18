"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Post = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
};

export default function ProfilePostsV2() {
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // USER
  // =========================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // =========================
  // LOAD POSTS
  // =========================
  async function loadPosts(uid: string) {
    setLoading(true);

    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    setPosts(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (userId) loadPosts(userId);
  }, [userId]);

  // =========================
  // REALTIME
  // =========================
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`posts-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPosts((p) => [payload.new as Post, ...p]);
          }

          if (payload.eventType === "DELETE") {
            setPosts((p) =>
              p.filter((x) => x.id !== (payload.old as Post).id)
            );
          }

          if (payload.eventType === "UPDATE") {
            setPosts((p) =>
              p.map((x) =>
                x.id === (payload.new as Post).id
                  ? (payload.new as Post)
                  : x
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // =========================
  // DELETE
  // =========================
  async function deletePost(id: string) {
    setPosts((p) => p.filter((x) => x.id !== id));

    await supabase.from("posts").delete().eq("id", id);
  }

  // =========================
  // STATES
  // =========================
  if (!userId) {
    return (
      <div className="text-sm text-gray-500">
        Trebuie să fii logat.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-20 bg-gray-100 animate-pulse rounded-xl" />
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Nu ai încă niciun text.
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-4">

      {posts.map((post) => (
        <div
          key={post.id}
          className="
            bg-white border border-gray-100
            rounded-xl p-4
            hover:shadow-sm transition
          "
        >

          {/* TITLE */}
          <h3 className="font-semibold text-sm">
            {post.title}
          </h3>

          {/* CONTENT */}
          <p className="text-sm text-gray-700 mt-2 line-clamp-4 leading-relaxed">
            {post.content}
          </p>

          {/* FOOTER */}
          <div className="flex justify-between items-center mt-4">

            <span className="text-xs text-gray-400">
              {new Date(post.created_at).toLocaleDateString()}
            </span>

            <button
              onClick={() => deletePost(post.id)}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Șterge
            </button>

          </div>

        </div>
      ))}

    </div>
  );
}