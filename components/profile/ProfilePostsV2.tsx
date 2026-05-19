"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toPlainText } from "@/lib/content";
import { supabase } from "@/lib/supabaseClient";
import type { Post } from "@/lib/types";

export default function ProfilePostsV2() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data: userData } =
        await supabase.auth.getUser();

      const uid = userData.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("LOAD PROFILE POSTS ERROR:", error);
        setError("Nu am putut încărca textele tale.");
        setLoading(false);
        return;
      }

      setPosts(data || []);
      setLoading(false);
    }

    load();
  }, []);

  async function deletePost(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setError(null);
      return;
    }

    const previousPosts = posts;
    setDeletingId(id);
    setError(null);
    setPosts((p) => p.filter((x) => x.id !== id));

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DELETE POST ERROR:", error);
      setPosts(previousPosts);
      setError("Nu s-a putut șterge textul.");
      setDeletingId(null);
      return;
    }

    setConfirmDeleteId(null);
    setDeletingId(null);
  }

  async function saveEdit(postId: string) {
    if (!editText.trim()) {
      setError("Textul nu poate fi gol.");
      return;
    }

    setSavingId(postId);
    setError(null);

    const { error } = await supabase
      .from("posts")
      .update({ content: editText })
      .eq("id", postId);

    if (error) {
      console.error("UPDATE POST ERROR:", error);
      setError("Nu s-a putut salva textul.");
      setSavingId(null);
      return;
    }

    setPosts((p) =>
      p.map((x) =>
        x.id === postId
          ? { ...x, content: editText }
          : x
      )
    );

    setEditingId(null);
    setSavingId(null);
  }

  return (
    <div className="space-y-3">

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
      )}

      {!loading && posts.length === 0 && !error && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-500">
          Nu ai încă niciun text publicat.
        </div>
      )}

      {posts.map((post) => (
        <article
          key={post.id}
          className="
            bg-white
            border border-gray-100
            rounded-xl
            p-4 sm:p-5
            transition
            hover:shadow-sm
          "
        >

          {/* META */}
          <div className="text-xs text-gray-400 mb-2">
            {new Date(
              post.created_at
            ).toLocaleDateString()}
          </div>

          {/* CONTENT */}
          {editingId === post.id ? (
            <div className="space-y-3">

              <textarea
                value={editText}
                onChange={(e) =>
                  setEditText(e.target.value)
                }
                className="
                  w-full border
                  rounded-xl p-3
                  text-sm
                  min-h-[140px]
                "
              />

              <div className="flex gap-2">

                <button
                  onClick={() =>
                    void saveEdit(post.id)
                  }
                  disabled={savingId === post.id}
                  className="
                    bg-black text-white
                    px-4 py-2
                    rounded-xl text-sm
                    disabled:cursor-wait
                    disabled:opacity-60
                  "
                >
                  {savingId === post.id ? "Saving..." : "Save"}
                </button>

                <button
                  onClick={() =>
                    setEditingId(null)
                  }
                  disabled={savingId === post.id}
                  className="text-sm text-gray-500"
                >
                  Cancel
                </button>

              </div>

            </div>
          ) : (
            <>
              {/* TEXT (Instagram-like clamp) */}
              <div
                className="
                  text-sm text-gray-800
                  line-clamp-4
                  whitespace-pre-wrap
                "
              >
                {toPlainText(post.content)}
              </div>

              {/* ACTIONS (Instagram-like simple row) */}
              <div className="flex gap-6 mt-3 text-sm">

                <Link
                  href={`/post/${post.id}`}
                  className="text-gray-600 hover:text-black"
                >
                  View
                </Link>

                <button
                  onClick={() => {
                    setEditingId(post.id);
                    setEditText(post.content ?? "");
                  }}
                  className="text-blue-600"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    void deletePost(post.id)
                  }
                  disabled={deletingId === post.id}
                  className="text-red-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {deletingId === post.id
                    ? "Deleting..."
                    : confirmDeleteId === post.id
                      ? "Confirm delete"
                      : "Delete"}
                </button>

              </div>
            </>
          )}
        </article>
      ))}
    </div>
  );
}
