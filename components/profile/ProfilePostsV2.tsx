"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePostsV2() {
  const [posts, setPosts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } =
        await supabase.auth.getUser();

      const uid = userData.user?.id;
      if (!uid) return;

      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      setPosts(data || []);
    }

    load();
  }, []);

  async function deletePost(id: string) {
    const ok = confirm("Delete this post?");
    if (!ok) return;

    await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    setPosts((p) =>
      p.filter((x) => x.id !== id)
    );
  }

  async function saveEdit(postId: string) {
    await supabase
      .from("posts")
      .update({ content: editText })
      .eq("id", postId);

    setPosts((p) =>
      p.map((x) =>
        x.id === postId
          ? { ...x, content: editText }
          : x
      )
    );

    setEditingId(null);
  }

  return (
    <div className="space-y-3">

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
                    saveEdit(post.id)
                  }
                  className="
                    bg-black text-white
                    px-4 py-2
                    rounded-xl text-sm
                  "
                >
                  Save
                </button>

                <button
                  onClick={() =>
                    setEditingId(null)
                  }
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
                dangerouslySetInnerHTML={{
                  __html: post.content,
                }}
              />

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
                    setEditText(post.content);
                  }}
                  className="text-blue-600"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    deletePost(post.id)
                  }
                  className="text-red-500"
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