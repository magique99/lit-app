"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Post = {
  id: string;
  title: string;
  content: string;
  user_id: string;
};

export default function ProfilePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  // =========================
  // LOAD USER + POSTS
  // =========================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id || null;
      setUserId(id);

      if (id) loadPosts(id);
    });
  }, []);

  async function loadPosts(id: string) {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    setPosts(data || []);
  }

  // =========================
  // DELETE POST
  // =========================
  async function deletePost(id: string) {
    const confirm = window.confirm("Ștergi acest text?");
    if (!confirm) return;

    setPosts((p) => p.filter((x) => x.id !== id));

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Eroare la ștergere");
      console.error(error);
      return;
    }
  }

  // =========================
  // START EDIT
  // =========================
  function startEdit(post: Post) {
    setEditingId(post.id);
    setEditText(post.content);
  }

  // =========================
  // SAVE EDIT
  // =========================
  async function saveEdit(id: string) {
    setLoading(true);

    const old = [...posts];

    // optimistic update
    setPosts((p) =>
      p.map((x) =>
        x.id === id ? { ...x, content: editText } : x
      )
    );

    setEditingId(null);

    const { error } = await supabase
      .from("posts")
      .update({
        content: editText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setLoading(false);

    if (error) {
      alert("Eroare la update");
      console.error(error);
      setPosts(old); // rollback
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-4">

      {posts.map((p) => (
        <div key={p.id} className="border p-4 rounded">

          <h3 className="font-bold mb-2">{p.title}</h3>

          {editingId === p.id ? (
            <>
              <textarea
                className="w-full border p-2 rounded"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => saveEdit(p.id)}
                  disabled={loading}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Save
                </button>

                <button
                  onClick={() => setEditingId(null)}
                  className="bg-gray-400 text-white px-3 py-1 rounded"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm">{p.content}</p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => startEdit(p)}
                  className="text-blue-600"
                >
                  Edit
                </button>

                <button
                  onClick={() => deletePost(p.id)}
                  className="text-red-600"
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