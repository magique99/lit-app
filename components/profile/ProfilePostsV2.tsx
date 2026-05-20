"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { htmlToPlainTextWithNewlines } from "@/lib/content";
import { supabase } from "@/lib/supabaseClient";
import type { Post, Profile } from "@/lib/types";

const PAGE_SIZE = 5;

export default function ProfilePostsV2() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
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

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("LOAD PROFILE POSTS ERROR:", postsError);
        setError("Nu am putut încărca textele tale.");
        setLoading(false);
        return;
      }

       // Fetch profile
       const { data: profileData, error: profileError } = await supabase
         .from("profiles")
         .select("username, avatar_url, bio, first_name, last_name, nickname, gender, age, city, country, phone, vehicle, awards, role, created_at, updated_at")
         .eq("user_id", uid)
         .single();

      if (profileError && !profileError?.message?.includes("No rows")) {
        console.error("LOAD PROFILE ERROR:", profileError);
        setError("Nu am putut încărca informațiile de profil.");
        setLoading(false);
        return;
      }

      setPosts(postsData || []);
      
       // Convert profile data to match Profile type
       if (profileData) {
         setProfile({
           username: profileData.username,
           avatar_url: profileData.avatar_url,
           bio: profileData.bio ?? null,
           id: uid,
           user_id: uid,
           created_at: profileData.created_at ?? null,
           updated_at: profileData.updated_at ?? null,
           role: profileData.role ?? null,
           // New fields
           first_name: profileData.first_name ?? null,
           last_name: profileData.last_name ?? null,
           nickname: profileData.nickname ?? null,
           gender: profileData.gender ?? null,
           age: profileData.age ?? null,
           city: profileData.city ?? null,
           country: profileData.country ?? null,
           phone: profileData.phone ?? null,
           vehicle: profileData.vehicle ?? null,
           awards: profileData.awards ?? null,
         });
       } else {
         setProfile(null);
       }
      setLoading(false);
    }

    load();
  }, []);

  // Rest of the component remains the same until the return statement

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
    <div className="space-y-[10px] py-[10px]">
      {posts.map((post, index) => (
        <>
          {editingId === post.id ? (
            <div className="bg-white border border-slate-200/90 shadow-[0_20px_80px_rgba(15,23,42,0.08)] rounded-[2rem] p-7">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={profile?.avatar_url ?? "/user.jpg"}
                    alt={profile?.username ?? "Author avatar"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      @{profile?.username ?? "anonim"}
                    </p>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      Autor
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(null);
                    }}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      void saveEdit(post.id);
                    }}
                    disabled={savingId === post.id}
                    className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingId === post.id ? "Salvez..." : "Salvează"}
                  </button>
                </div>
              </div>

              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-[1.5rem] px-5 py-4 text-lg text-slate-900 placeholder:text-slate-500 shadow-sm focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100 min-h-[200px]"
                disabled={savingId === post.id}
              />
            </div>
          ) : (
            <Link key={post.id} href={`/post/${post.id}`}>
              <article className="group cursor-pointer overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:border-slate-300/80">
                <div className="p-7">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-3">
                        <img
                          src={profile?.avatar_url ?? "/user.jpg"}
                          alt={profile?.username ?? "Author avatar"}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            @{profile?.username ?? "anonim"}
                          </p>
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                            Autor
                          </p>
                        </div>
                      </div>

                      <h2 className="text-xl font-semibold leading-none text-slate-950">
                        {post.title}
                      </h2>
                    </div>

                    <Link
                      href={`/post/${post.id}`}
                      className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-amber-300"
                    >
                      Citește acum
                    </Link>
                  </div>

                  <p
                    className={`mt-4 text-base leading-8 text-slate-600 ${index < PAGE_SIZE ? 'line-clamp-2' : 'line-clamp-3'}`}
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {htmlToPlainTextWithNewlines(post.content)}
                  </p>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  {/* Like button placeholder - would need actual like implementation */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Handle like functionality would go here
                    }}
                    disabled={true} // Simplified for now
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 active:scale-95 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    ❤️
                    <span>0</span>
                  </button>

                  <span className="inline-flex items-center gap-2">
                    💬<span>0</span>
                  </span>
                </div>
                </div>
              </article>
            </Link>
          )}
        </>
      ))}
    </div>
  );
}
