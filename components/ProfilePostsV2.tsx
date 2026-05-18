"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePostsV2() {
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // GET USER
  // =========================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // =========================
  // LOAD POSTS
  // =========================
  useEffect(() => {
    if (!userId) return;

    async function loadPosts() {
      setLoading(true);

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("LOAD POSTS ERROR:", error);
      }

      setPosts(data || []);
      setLoading(false);
    }

    loadPosts();
  }, [userId]);

  // =========================
  // DELETE POST (optional)
  // =========================
  async function deletePost(id: string) {
    await supabase.from("posts").delete().eq("id", id);

    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  // =========================
  // UI
  // =========================
  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (!posts.length) {
    return (
      <div className="text-sm text-gray-500">
        Nu ai încă niciun text.
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {posts.map((post) => (
        <div
          key={post.id}
          className="border rounded-lg p-3 hover:shadow-sm transition"
        >

          {/* TITLE */}
          <h3 className="font-semibold text-sm">
            {post.title}
          </h3>

          {/* CONTENT (TRUNCATED) */}
          <p className="text-sm text-gray-600 mt-2 line-clamp-4">
            {post.content}
          </p>

          {/* FOOTER */}
          <div className="flex justify-between items-center mt-3">

            <span className="text-xs text-gray-400">
              {new Date(post.created_at).toLocaleDateString()}
            </span>

            <div className="flex gap-3">

              <button
                className="text-xs text-blue-600"
                onClick={() => {
                  window.location.href = `/post/${post.id}`;
                }}
              >
                View
              </button>

              <button
                className="text-xs text-red-500"
                onClick={() => deletePost(post.id)}
              >
                Delete
              </button>

            </div>

          </div>

        </div>
      ))}

    </div>
  );
}