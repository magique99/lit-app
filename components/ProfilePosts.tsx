"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Post = {
  id: string;
  title: string;
  content: string;
};

export default function ProfilePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // =========================
  // LOAD POSTS
  // =========================
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id;
      if (!id) return;

      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);
    });
  }, []);

  // =========================
  // DELETE
  // =========================
  async function deletePost(id: string) {
    const ok = confirm("Delete this post?");
    if (!ok) return;

    setPosts((p) => p.filter((x) => x.id !== id));

    await supabase.from("posts").delete().eq("id", id);
  }

  // =========================
  // SAVE EDIT
  // =========================
  async function saveEdit(id: string) {
    await supabase
      .from("posts")
      .update({
        content: editText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setPosts((p) =>
      p.map((x) =>
        x.id === id ? { ...x, content: editText } : x
      )
    );

    setEditingId(null);
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-4">

      {posts.map((p) => (
        <div
          key={p.id}
          className="
            bg-white border border-gray-100
            rounded-xl p-4
          "
        >

          {/* TITLE */}
          <h3 className="font-semibold text-sm mb-2">
            {p.title}
          </h3>

          {/* CONTENT */}
          {editingId === p.id ? (
            <div className="space-y-2">

              <textarea
                value={editText}
                onChange={(e) =>
                  setEditText(e.target.value)
                }
                className="w-full border rounded-xl p-2 min-h-[120px]"
              />

              <div className="flex gap-2">

                <button
                  onClick={() => saveEdit(p.id)}
                  className="bg-black text-white px-3 py-1 rounded-xl"
                >
                  Save
                </button>

                <button
                  onClick={() => setEditingId(null)}
                  className="text-gray-500 text-sm"
                >
                  Cancel
                </button>

              </div>

            </div>
          ) : (
            <>
              <p
                className="
                  text-sm text-gray-700
                  line-clamp-4
                  leading-relaxed
                "
              >
                {p.content}
              </p>

              {/* ACTIONS */}
              <div className="flex gap-4 mt-3 text-xs">

                <button
                  onClick={() => {
                    setEditingId(p.id);
                    setEditText(p.content);
                  }}
                  className="text-blue-600"
                >
                  Edit
                </button>

                <button
                  onClick={() => deletePost(p.id)}
                  className="text-red-500"
                >
                  Delete
                </button>

              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}