"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePostsV2() {
  const [posts, setPosts] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editText, setEditText] =
    useState("");

  // =========================
  // LOAD POSTS
  // =========================
  useEffect(() => {
    async function load() {
      const { data: userData } =
        await supabase.auth.getUser();

      const uid = userData.user?.id;

      if (!uid) return;

      setUserId(uid);

      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", {
          ascending: false,
        });

      setPosts(data || []);
    }

    load();
  }, []);

  // =========================
  // DELETE
  // =========================
  async function deletePost(id: string) {
    const ok = confirm(
      "Delete this text?"
    );

    if (!ok) return;

    await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    setPosts((prev) =>
      prev.filter((p) => p.id !== id)
    );
  }

  // =========================
  // SAVE EDIT
  // =========================
  async function saveEdit(
    postId: string
  ) {
    await supabase
      .from("posts")
      .update({
        content: editText,
      })
      .eq("id", postId);

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              content: editText,
            }
          : p
      )
    );

    setEditingId(null);
  }

  return (
    <div className="space-y-5">

      {posts.map((post) => (
        <article
          key={post.id}
          className="
            bg-white rounded-2xl
            border border-gray-200
            p-6
            hover:shadow-md
            transition
          "
        >

          {/* META */}
          <div className="flex justify-between text-xs text-gray-500 mb-3">

            <span>
              {new Date(
                post.created_at
              ).toLocaleDateString()}
            </span>

          </div>

          {/* CONTENT */}
          {editingId === post.id ? (
            <div className="space-y-3">

              <textarea
                value={editText}
                onChange={(e) =>
                  setEditText(
                    e.target.value
                  )
                }
                className="
                  w-full border
                  rounded-xl p-3
                  min-h-[180px]
                "
              />

              <div className="flex gap-2">

                <button
                  onClick={() =>
                    saveEdit(post.id)
                  }
                  className="
                    bg-black text-white
                    px-4 py-2 rounded-xl
                  "
                >
                  Save
                </button>

                <button
                  onClick={() =>
                    setEditingId(null)
                  }
                  className="
                    text-gray-500
                  "
                >
                  Cancel
                </button>

              </div>
            </div>
          ) : (
            <>
              <div
                className="
                  text-gray-800
                  whitespace-pre-wrap
                  line-clamp-4
                "
              >
                {post.content}
              </div>

              {/* ACTIONS */}
              <div className="flex gap-5 mt-5 text-sm">

                <Link
                  href={`/post/${post.id}`}
                  className="
                    text-gray-700
                    hover:text-black
                  "
                >
                  View
                </Link>

                <button
                  onClick={() => {
                    setEditingId(
                      post.id
                    );
                    setEditText(
                      post.content
                    );
                  }}
                  className="
                    text-blue-600
                  "
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    deletePost(post.id)
                  }
                  className="
                    text-red-600
                  "
                >
                  Delete
                </button>

              </div>
            </>
          )}
        </article>
      ))}
    </div>
  );
}