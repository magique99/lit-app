"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Post, Profile } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

type AuthorWithStats = Profile & {
  postCount: number;
};

const C = {
  bg: "#F7F3EE",
  surface: "#FFFCF7",
  text: "#2A2520",
  muted: "#7A7268",
  border: "#E8E0D8",
  accent: "#B87D4B",
};

export default function AutoriPage() {
  const [authors, setAuthors] = useState<AuthorWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuthors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all authors who have at least one post
      const { data: authorsData, error: authorsError } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .order("created_at", { ascending: true });

      if (authorsError) throw authorsError;

      if (!authorsData || authorsData.length === 0) {
        setAuthors([]);
        setLoading(false);
        return;
      }

      const userIds = authorsData.map((a) => a.user_id);

      // Count posts per user
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("user_id")
        .in("user_id", userIds);

      if (postsError) throw postsError;

      const postCountMap: Record<string, number> = {};
      for (const post of (postsData ?? []) as Post[]) {
        const uid = post.user_id;
        if (uid) postCountMap[uid] = (postCountMap[uid] ?? 0) + 1;
      }

      // Count likes per user's posts
      const { data: allPostsData } = await supabase
        .from("posts")
        .select("id, user_id")
        .in("user_id", userIds);

      const userPostIdsMap: Record<string, string[]> = {};
      for (const post of (allPostsData ?? []) as Post[]) {
        if (post.user_id && post.id) {
          if (!userPostIdsMap[post.user_id]) userPostIdsMap[post.user_id] = [];
          userPostIdsMap[post.user_id].push(post.id);
        }
      }

      const likesMap: Record<string, number> = {};
      for (const uid of Object.keys(userPostIdsMap)) {
        const ids = userPostIdsMap[uid];
        if (ids.length > 0) {
          const { data: likesData } = await supabase
            .from("likes")
            .select("post_id")
            .in("post_id", ids);
          likesMap[uid] = (likesData ?? []).length;
        } else {
          likesMap[uid] = 0;
        }
      }

      const sorted = authorsData
        .map((profile) => {
          const count = postCountMap[profile.user_id] ?? 0;
          return {
            ...profile,
            postCount: count,
          } as AuthorWithStats;
        })
        .sort((a, b) => b.postCount - a.postCount);

      setAuthors(sorted);
    } catch (err) {
      console.error("Error loading authors:", err);
      setError("Nu am putut încărca autorii. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthors();
  }, []);

  useEffect(() => {
    loadAuthors();
  }, []);

  return (
    <main className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-14 pb-24">
        {/* Page label */}
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-10">
          Autori
        </p>

        {/* Heading */}
        <div className="mb-16">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium leading-tight" style={{ color: C.text }}>
            Descoperă autori
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: C.muted }}>
            Cei care au contribuit cu texte pe această platformă.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden mb-20 bg-slate-200/60">
          {[
            { label: "Autori", value: authors.length },
            { label: "Texte publicate", value: authors.reduce((s, a) => s + a.postCount, 0) },
            { label: "Comunitate", value: authors.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/40 px-4 py-6 text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-1.5">{label}</p>
              <p className="text-2xl font-light text-slate-800 tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Errors */}
        {error && (
          <p className="mb-10 text-sm text-rose-500/80">{error}</p>
        )}

        {/* Authors list */}
        <section>
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-20">Încărcare autori…</p>
          ) : authors.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-20">Niciun autor găsit.</p>
          ) : (
            <div className="flex flex-col">
              {authors.map((author, index) => (
                <Link
                  key={author.user_id}
                  href={`/profile/${author.user_id}`}
                  className="group flex items-center gap-5 py-8 first:pt-0 last:pb-0"
                >
                  {/* Rank */}
                  <span className="shrink-0 w-6 text-right text-[11px] font-medium text-slate-300 tabular-nums">
                    {index + 1}
                  </span>

                  {/* Avatar */}
                  <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden border border-slate-200/60">
                    <Image
                      src={author.avatar_url ?? "/user.jpg"}
                      alt={author.username ?? "autor"}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-slate-900 group-hover:text-slate-600 transition-colors">
                      @{author.username ?? "anonim"}
                    </p>
                    <p className="text-[12px] mt-0.5 text-slate-400">
                      {author.postCount === 0 ? "Fără texte" : `${author.postCount} ${author.postCount === 1 ? "text publicat" : "texte publicate"}`}
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg
                    className="shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 4h6M10 8l3-3-3-3" />
                  </svg>
                </Link>
              ))}
              <hr className="border-b border-slate-100/80 last:border-none" />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
