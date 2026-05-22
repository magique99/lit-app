"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, Post } from "@/lib/types";
import { toProfile } from "@/lib/types";

type Props = {
  userId: string;
};

export default function ViewProfileClient({ userId }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError && !profileError?.message?.includes("No rows")) {
          console.error("LOAD PROFILE ERROR:", profileError);
          setError("Nu am putut încărca profilul utilizatorului.");
          setLoading(false);
          return;
        }

        setProfile(profileData ? toProfile(profileData) : null);

        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (postsError) {
          console.error("LOAD POSTS ERROR:", postsError);
          setError("Nu am putut încărca postările utilizatorului.");
          setLoading(false);
          return;
        }

        setPosts(postsData ?? []);
        setLoading(false);
      } catch (err) {
        console.error("LOAD PROFILE ERROR:", err);
        setError("A apărut o eroare la încărcarea profilului.");
        setLoading(false);
      }
    }

    loadProfile();
  }, [userId]);

  if (loading) {
    return <div className="text-center py-20">Se încarcă profilul...</div>;
  }

  if (error || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-600 mb-4">
          {error || "Acest utilizator nu are un profil configurat."}
        </p>
        <Link
          href="/"
          className="text-amber-600 hover:text-amber-700 underline"
        >
          Înapoi la pagina principală
        </Link>
      </div>
    );
  }

  const authorName = profile.username || "Fără nume";

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-amber-600 transition-colors"
        >
          ← Înapoi la pagina principală
        </Link>
      </div>

      <div className="rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 h-16" />

        <div className="px-5 pb-5 pt-2">
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative w-24 h-24 rounded-full border-4 border-white bg-slate-200 overflow-hidden shrink-0 -mt-12 sm:-mt-14">
              <Image
                src={profile.avatar_url ?? "/user.jpg"}
                alt={profile.username || "Avatar"}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                @{authorName}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm text-slate-600 mt-1">
                {profile.first_name && profile.last_name && (
                  <span className="text-slate-800">
                    {profile.first_name} {profile.last_name}
                  </span>
                )}
                {!profile.first_name && !profile.last_name && profile.nickname && (
                  <span className="italic text-slate-800">
                    &ldquo;{profile.nickname}&rdquo;
                  </span>
                )}
                {profile.bio && (
                  <>
                    <span className="hidden sm:inline">·</span>
                    <span className="text-slate-500">{profile.bio}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm">
            <div className="flex flex-col items-center py-2 px-4 bg-slate-50 rounded-xl min-w-[80px]">
              <span className="text-xl font-bold text-slate-900">
                {profile.posts_count ?? 0}
              </span>
              <span className="text-xs text-slate-500">Texte</span>
            </div>
            <div className="flex flex-col items-center py-2 px-4 bg-slate-50 rounded-xl min-w-[80px]">
              <span className="text-xl font-bold text-slate-900">
                {profile.followers_count ?? 0}
              </span>
              <span className="text-xs text-slate-500">Urmăritori</span>
            </div>
            <div className="flex flex-col items-center py-2 px-4 bg-slate-50 rounded-xl min-w-[80px]">
              <span className="text-xl font-bold text-slate-900">
                {profile.likes_count ?? 0}
              </span>
              <span className="text-xs text-slate-500">Aprecieri</span>
            </div>
            <div className="flex flex-col items-center py-2 px-4 bg-slate-50 rounded-xl min-w-[80px]">
              <span className="text-xl font-bold text-slate-900">
                {profile.comments_count ?? 0}
              </span>
              <span className="text-xs text-slate-500">Comentarii</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Texte ale lui @{authorName}
        </h2>

        {posts.length === 0 ? (
          <div className="text-slate-500 text-center py-10">
            {profile?.username} încă nu a publicat nici un text.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:shadow-[0_20px_60px_rgba(15,23,42,0.1)]"
              >
                <div className="p-5 sm:p-6">
                  <Link
                    href={`/post/${post.id}`}
                    className="inline-block"
                  >
                    <h3 className="text-lg font-semibold leading-none text-slate-950 hover:text-amber-700 transition-colors">
                      {post.title}
                    </h3>
                  </Link>

                  <p
                    className="mt-2 text-sm leading-6 text-slate-600 line-clamp-2"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {post.content?.slice(0, 200)}
                    {post.content?.length > 200 ? "…" : ""}
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    Publicat{" "}
                    {new Date(post.created_at).toLocaleDateString("ro-RO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
