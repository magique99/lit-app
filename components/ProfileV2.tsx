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
  // GET USER
  // =========================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // =========================
  // LOAD POSTS (SAFE)
  // =========================
  async function loadPosts(uid: string) {
    setLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD POSTS ERROR:", error);
    }

    setPosts(data ?? []);
    setLoading(false);
  }

  // =========================
  // INIT LOAD (FIX ASYNC BUG)
  // =========================
  useEffect(() => {
    if (!userId) return;

    loadPosts(userId);
  }, [userId]);

  // =========================
  // REALTIME POSTS
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
            setPosts((prev) => [payload.new as Post, ...prev]);
          }

          if (payload.eventType === "DELETE") {
            setPosts((prev) =>
              prev.filter((p) => p.id !== (payload.old as Post).id)
            );
          }

          if (payload.eventType === "UPDATE") {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === (payload.new as Post).id
                  ? (payload.new as Post)
                  : p
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
  // DELETE POST
  // =========================
  async function deletePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DELETE ERROR:", error);
    }
  }

  // =========================
  // UI STATES
  // =========================
  if (!userId) {
    return <div className="text-sm text-gray-500">Trebuie să fii logat.</div>;
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Se încarcă textele...</div>;
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
          className="border rounded-lg p-4 hover:shadow-sm transition"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-semibold">{post.title}</h3>

            <button
              onClick={() => deletePost(post.id)}
              className="text-red-500 text-sm"
            >
              Șterge
            </button>
          </div>

            <p className="text-sm text-gray-600 mt-2 line-clamp-4">
                {post.content}
            </p>

          <p className="text-xs text-gray-400 mt-3">
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}