"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { htmlToPlainTextWithNewlines } from "@/lib/content";
import { supabase } from "@/lib/supabaseClient";
import Spinner from "@/components/Spinner";
import type { Post } from "@/lib/types";

export default function ProfilePostsV2() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load posts for current user
  useEffect(() => {
    async function loadPosts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setError("Nu am putut încărca textele.");
      } else {
        setPosts(data as Post[]);
      }
      setLoading(false);
    }
    loadPosts();
  }, []);

  async function deletePost(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setError(null);
      return;
    }

    const prev = posts;
    setError(null);
    setPosts(p => p.filter(x => x.id !== id));

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) {
      setPosts(prev);
      setError("Nu s-a putut șterge textul.");
      setConfirmDeleteId(null);
      return;
    }

    setConfirmDeleteId(null);
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

    setPosts(p => p.map(x => x.id === postId ? { ...x, content: editText } : x));
    setEditingId(null);
    setSavingId(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <p className="text-center text-rose-500/70 text-[13px] py-10">{error}</p>
    );
  }

  if (!loading && !error && posts.length === 0) {
    return (
      <p className="text-center text-slate-400 text-[13px] py-10">
        Nu ai încă nici un text publicat.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {posts.map((post) => {
        const plainText = htmlToPlainTextWithNewlines(post.content).trim();
        const preview = plainText === ""
          ? "Fără text"
          : plainText.length > 220
            ? plainText.slice(0, 220) + "…"
            : plainText;

        return (
          <article key={post.id} className="group py-8 first:pt-0 last:pb-0">

            {editingId === post.id ? (
              /* ── EDIT MODE ── */
              <div className="space-y-4">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="
                    w-full
                    border border-slate-200 bg-slate-50
                    rounded-2xl px-5 py-4
                    text-[15px] text-slate-800
                    placeholder:text-slate-400
                    focus:border-slate-400 focus:bg-white focus:outline-none
                    min-h-[180px]
                    resize-y
                  "
                  disabled={savingId === post.id}
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setEditingId(null); setEditText(""); }}
                    className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Anulează
                  </button>
                  <button
                    onClick={() => { void saveEdit(post.id); }}
                    disabled={savingId === post.id}
                    className="
                      text-[12px] font-semibold
                      rounded-full
                      px-5 py-2
                      bg-[#B87D4B] text-white
                      hover:bg-[#9E6538]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors
                    "
                  >
                    {savingId === post.id ? "Salvez…" : "Salvează"}
                  </button>
                </div>
                {error && savingId === post.id && (
                  <p className="text-[12px] text-rose-500">{error}</p>
                )}
              </div>
            ) : (
              /* ── VIEW MODE ── */
              <>
                <Link
                  href={`/post/${post.id}`}
                  className="
                    font-serif text-[24px] sm:text-[28px]
                    leading-[1.2]
                    font-medium
                    transition-opacity duration-200
                    group-hover:opacity-50
                  "
                  style={{ color: "#2A2520" }}
                >
                  {post.title}
                </Link>

                <p
                  className="
                    mt-2.5
                    text-[15px]
                    leading-[1.8]
                    text-slate-400
                    max-w-xl
                  "
                  style={{ whiteSpace: "pre-line" }}
                >
                  {preview}
                </p>

                <div className="mt-3 flex items-center gap-5 text-[12px] text-slate-300">
                  {/* created date */}
                  <span>
                    {new Date(post.created_at).toLocaleDateString("ro-RO", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
<span className="text-slate-200">·</span>
                   {/* edit btn — visible on hover - redirects to edit page */}
                   <Link
                     href={`/post/${post.id}/edit`}
                     className="
                       opacity-0 group-hover:opacity-100
                       transition-opacity duration-200
                       text-slate-500 hover:text-slate-700
                     "
                   >
                     Editează
                   </Link>
                  {/* delete btn */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void deletePost(post.id);
                    }}
                    className="
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-200
                      text-slate-400 hover:text-rose-500
                    "
                  >
                    Șterge
                  </button>
                </div>
              </>
            )}

            {/* divider */}
            {confirmDeleteId === post.id && (
              <div className="mt-4 mb-2 text-[13px] text-rose-500">
                Confirmă ștergerea?{' '}
                <button
                  onClick={() => void deletePost(post.id)}
                  className="font-semibold underline"
                >
                  Da, șterge
                </button>{' '}
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-slate-500"
                >
                  Nu
                </button>
              </div>
            )}

            <div className="mt-8 border-b border-slate-200/60 last:border-none" />
          </article>
        );
      })}
    </div>
  );
}
