"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { htmlToPlainTextWithNewlines } from "@/lib/content";
import { supabase } from "@/lib/supabaseClient";
import type { Comment, Post, Profile, LikeInsert } from "@/lib/types";

type PostWithProfile = Post & {
  profile?: Pick<Profile, "username" | "avatar_url"> | null;
  likesCount?: number;
  commentsCount?: number;
  text_type?: string | null;
  genre?: string | null;
  uses_ai?: boolean | null;
  likes?: { id: string }[] | null;
  comments?: { id: string }[] | null;
};


const PAGE_SIZE = 5;

const TEXT_TYPES = ["Toate", "Proză", "Poezie", "Teatru", "Jurnal", "Eseu"];
const GENRES = ["Toate", "Ficțiune", "Non-ficțiune", "SF", "Thriller", "Polițist", "Romantic", "Grotesc", "Simbolic", "Oniric", "Altul"];

const C = {
  bg: "#F7F3EE",
  surface: "#FFFCF7",
  text: "#2A2520",
  muted: "#7A7268",
  border: "#E8E0D8",
  accent: "#B87D4B",
};

const QUOTES = [
  "Literatește nu e un dar. Este o practică zilnică a atenției.",
  "Cuvintele bune sunt cele care rămân după ce ai citit totul.",
  "Literatura nu se grăbește. E ca un pătrunjel – crește în tăcere.",
  "Un text bun e ca o rană curată – ambele au nevoie de răbdare.",
];

const TAGS = ["Grotesc", "Simbolic", "Oniric", "Poezie", "Eseu", "Ficțiune"];

export default function TextePage() {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {},
  );
const [latestComments, setLatestComments] = useState<Comment[]>([]);
   const [topViewedPosts, setTopViewedPosts] = useState<PostWithProfile[]>([]);
   const [filterType, setFilterType] = useState("");
   const [filterGenre, setFilterGenre] = useState("");
   const [searchQuery, setSearchQuery] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [likeError, setLikeError] = useState<string | null>(null);
   const [likingIds, setLikingIds] = useState<Set<string>>(new Set());
   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
   const [sidebarQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

   const totalLikes = useMemo(
     () => Object.values(likeCounts).reduce((sum, count) => sum + count, 0),
     [likeCounts],
   );

const authorsCount = useMemo(() => {
    return new Set(posts.map((p) => p.user_id).filter(Boolean)).size;
  }, [posts]);

  async function loadCounts(postIds: string[]) {
    if (postIds.length === 0) return;

    const [
      { data: likesData, error: likesError },
      { data: commentsData, error: commentsError },
    ] = await Promise.all([
      supabase.from("likes").select("post_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
    ]);

    if (likesError || commentsError) {
      throw likesError ?? commentsError;
    }

    const nextLikes: Record<string, number> = {};
    const nextComments: Record<string, number> = {};

    for (const id of postIds) {
      nextLikes[id] = 0;
      nextComments[id] = 0;
    }

    for (const like of likesData ?? []) {
      const postId = (like as { post_id: string }).post_id;
      nextLikes[postId] = (nextLikes[postId] ?? 0) + 1;
    }

    for (const comment of commentsData ?? []) {
      const postId = (comment as { post_id: string }).post_id;
      nextComments[postId] = (nextComments[postId] ?? 0) + 1;
    }

    setLikeCounts((prev) => ({ ...prev, ...nextLikes }));
    setCommentCounts((prev) => ({ ...prev, ...nextComments }));
  }

  const ensureProfiles = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;

    const { data: existingProfiles, error: checkError } = await supabase
      .from("profiles")
      .select("user_id")
      .in("user_id", userIds);

    if (checkError) {
      console.error("CHECK PROFILES ERROR:", checkError);
      return;
    }

    const existingIds = new Set(existingProfiles?.map((p) => p.user_id) ?? []);
    const missingUserIds = userIds.filter((id) => !existingIds.has(id));

    if (missingUserIds.length > 0) {
      console.log("Missing profiles for:", missingUserIds);
      const profilesToCreate = missingUserIds.map((uid) => ({
        user_id: uid,
        username: `user_${uid.slice(0, 8)}`,
      }));
      const { error: insertError } = await supabase
        .from("profiles")
        .insert(profilesToCreate);
      if (insertError) console.error("CREATE PROFILES ERROR:", insertError);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (filterType && filterType !== "Toate") {
      query = query.eq("text_type", filterType);
    }
    if (filterGenre && filterGenre !== "Toate") {
      query = query.eq("genre", filterGenre);
    }
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("LOAD POSTS ERROR:", error);
      setError("Nu am putut încărca postările. Încearcă din nou.");
      setLoading(false);
      return;
    }

    const nextPosts = (data ?? []) as PostWithProfile[];

    const userIds = Array.from(
      new Set(
        nextPosts.map((post: PostWithProfile) => post.user_id).filter(Boolean) as string[],
      ),
    );

    await ensureProfiles(userIds);

    let profileMap: Record<
      string,
      Pick<Profile, "username" | "avatar_url">
    > = {};

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("LOAD PROFILES ERROR:", profilesError);
      } else if (profilesData) {
        const typedProfilesData = profilesData as Array<{ user_id: string; username: string; avatar_url: string | null }>;
        profileMap = typedProfilesData.reduce(
          (map, profile) => ({
            ...map,
            [profile.user_id]: {
              username: profile.username,
              avatar_url: profile.avatar_url,
            },
          }),
          {},
        );
      }
    }

    const nextPostsWithProfile: PostWithProfile[] = nextPosts.map((post) => ({
      ...post,
      profile: post.user_id ? (profileMap[post.user_id] ?? null) : null,
    }));

    setPosts(nextPostsWithProfile);

    try {
      await loadCounts(nextPosts.map((post) => post.id));
    } catch (err) {
      console.error("LOAD COUNTS ERROR:", err);
      setError(
        "Postările s-au încărcat, dar nu am putut actualiza statisticile.",
      );
    }

    setLoading(false);
  }, [filterType, filterGenre, searchQuery]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadPosts();
    });
  }, [loadPosts]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    void loadPosts();
  };

  const loadTopPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*, likes(id), comments(id)");

    if (error) {
      console.error("LOAD TOP POSTS ERROR:", error);
      return;
    }

    if (!data) return;

    const userIds = Array.from(
      new Set(
        (data as PostWithProfile[]).map((p) => p.user_id).filter(Boolean) as string[],
      ),
    );

    await ensureProfiles(userIds);

    let profileMap: Record<
      string,
      Pick<Profile, "username" | "avatar_url">
    > = {};

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      console.log(
        "TOP POSTS - PROFILES QUERY - requested:",
        userIds.length,
        "got:",
        profilesData?.length ?? 0,
      );

      if (profilesError) {
        console.error("LOAD TOP POSTS PROFILES ERROR:", profilesError);
      } else if (profilesData) {
        const typedProfilesData = profilesData as Array<{
          user_id: string;
          username: string;
          avatar_url: string | null;
        }>;
        profileMap = typedProfilesData.reduce(
          (map, profile) => ({
            ...map,
            [profile.user_id]: {
              username: profile.username,
              avatar_url: profile.avatar_url,
            },
          }),
          {},
        );
      }
    }

    if (userIds.length > 0 && Object.keys(profileMap).length === 0) {
      console.warn("No profiles found for userIds:", userIds);
    }

    const postsWithCounts: PostWithProfile[] = (data as PostWithProfile[]).map((post) => ({
      ...post,
      profile: post.user_id ? (profileMap[post.user_id] ?? null) : null,
      likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
      commentsCount: Array.isArray(post.comments) ? post.comments.length : 0,
    }));

    // Sort by comments for "most viewed" display
    const sortedByComments = [...postsWithCounts].sort(
      (a, b) => (b.commentsCount ?? 0) - (a.commentsCount ?? 0),
    );

    setTopViewedPosts(sortedByComments.slice(0, 3));
  }, [ensureProfiles]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadTopPosts();
    });
  }, [loadTopPosts]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) {
        console.error("LOAD LATEST COMMENTS ERROR:", error);
        setError("Nu am putut încărca ultimele comentarii.");
        return;
      }

      setLatestComments(data ?? []);
    }

    load();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          const post = payload.new as Post;
          let profileData = null;
          if (post.user_id) {
            (async () => {
              try {
                const { data: profileDataResult, error } = await supabase
                  .from("profiles")
                  .select("username, avatar_url")
                  .eq("user_id", post.user_id)
                  .single();
                if (!error && profileDataResult) {
                  profileData = {
                    username: profileDataResult.username,
                    avatar_url: profileDataResult.avatar_url,
                  };
                }
              } catch (err) {
                console.error("Error fetching profile for realtime post:", err);
              }
            })();
          }
          const postWithProfile: PostWithProfile = {
            ...post,
            profile: profileData,
          };

          setPosts((prev) => {
            if (prev.some((item) => item.id === post.id)) return prev;
            return [postWithProfile, ...prev];
          });
          setLikeCounts((prev) => ({ ...prev, [post.id]: 0 }));
          setCommentCounts((prev) => ({ ...prev, [post.id]: 0 }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-comments")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
        },
        (payload) => {
          const comment = payload.new as Comment;

          setCommentCounts((prev) => ({
            ...prev,
            [comment.post_id]: (prev[comment.post_id] ?? 0) + 1,
          }));
          setLatestComments((prev) => [comment, ...prev].slice(0, 8));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage((p) => p + 1);
        }
      },
      {
        rootMargin: "200px",
      },
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [loading, hasMore]);

  async function handleLike(postId: string) {
    if (!currentUserId) {
      setLikeError("Trebuie să fii conectat pentru a da like.");
      return;
    }

    if (likingIds.has(postId)) return;

    setLikeError(null);
    setLikingIds((prev) => new Set(prev).add(postId));
    setLikeCounts((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? 0) + 1,
    }));

    const { error } = await supabase
      .from("likes")
      .insert({
        post_id: postId,
        user_id: currentUserId,
      } as LikeInsert);

    if (!error) {
      const { data: postData } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (postData && postData.user_id && postData.user_id !== currentUserId) {
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: postData.user_id,
            actor_id: currentUserId,
            post_id: postId,
            type: "like_post",
          });
        if (notifError) {
          console.error("NOTIFICATION ERROR:", notifError);
        } else {
          console.log("NOTIFICATION CREATED for user:", postData.user_id);
        }
      }
    }
  }

  const getLikes = (postId: string) => {
    return likeCounts[postId] ?? 0;
  };

  const getComments = (postId: string) => commentCounts[postId] ?? 0;

  return (
    <main className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* ── PAGE HEADER ── */}
            <div className="mb-12">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-4">
                Revistă literară
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium leading-tight" style={{ color: C.text }}>
                Texte originale
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed max-w-2xl" style={{ color: C.muted }}>
                Poezie, proză scurtă, jurnal, eseuri și experimente din comunitate.
              </p>
            </div>

            {/* ── SEARCH ── */}
            <div className="mb-14">
              <input
                type="text"
                placeholder="Caută după titlu sau conținut…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white/60 px-5 py-3.5 text-[15px] text-slate-800 placeholder:text-slate-300 focus:border-slate-400 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            {/* ── FILTER ROW ── */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-16">
              <div className="flex flex-wrap gap-2">
                {TEXT_TYPES.map((t) => {
                  const active = (filterType || "Toate") === t;
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setFilterType(t === "Toate" ? "" : t);
                        setPage(0); setPosts([]); setHasMore(true);
                      }}
                      className={`
                        rounded-full px-4 py-[6px] text-[12px] font-medium tracking-wide
                        transition-colors duration-150
                        ${active
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100/70 text-slate-500 hover:bg-slate-200/70 hover:text-slate-700"
                        }
                      `}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              <span className="text-slate-200 select-none">|</span>

              <div className="relative">
                <select
                  value={filterGenre}
                  onChange={(e) => {
                    setFilterGenre(e.target.value);
                    setPage(0); setPosts([]); setHasMore(true);
                  }}
                  className="
                    appearance-none
                    rounded-full px-4 pr-8 py-[6px]
                    text-[12px] font-medium tracking-wide
                    bg-slate-100/70 text-slate-500
                    hover:bg-slate-200/70 hover:text-slate-700
                    transition-colors duration-150
                    cursor-pointer
                    focus:outline-none
                  "
                >
                  <option value="">Genuri</option>
                  {GENRES.filter((g) => g !== "Toate").map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">
                  ▾
                </span>
              </div>
            </div>

            {/* Errors */}
            {error && (
              <p className="mb-10 text-sm text-rose-500/80">{error}</p>
            )}
            {likeError && (
              <p className="mb-10 text-sm text-amber-600/80">{likeError}</p>
            )}

            {/* ── POSTS LIST ── */}
            <section className="mb-28">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-10">
                Ultimele postări
              </p>

              <div className="flex flex-col">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="group py-8 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-5">
                      <Link
                        href={post.user_id ? `/profile/${post.user_id}` : "#"}
                        className="mt-0.5 shrink-0"
                      >
                        <Image
                          src={post.profile?.avatar_url ?? "/user.jpg"}
                          alt={post.profile?.username ?? "author"}
                          width={34}
                          height={34}
                          className="rounded-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          {post.profile?.username ? (
                            <Link
                              href={`/profile/${post.user_id}`}
                              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                            >
                              @{post.profile.username}
                            </Link>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              anonim
                            </span>
                          )}
                        </div>

                        <Link href={`/post/${post.id}`}>
                          <h2 className="text-[17px] font-medium text-slate-900 leading-snug mb-2 group-hover:text-slate-600 transition-colors">
                            {post.title}
                          </h2>
                        </Link>

                        <p
                          className="text-[13px] leading-relaxed text-slate-400 max-w-xl mb-4"
                          style={{ whiteSpace: "pre-line" }}
                        >
                          {htmlToPlainTextWithNewlines(post.content).slice(0, 220)}
                          {htmlToPlainTextWithNewlines(post.content).length > 220 ? "…" : ""}
                        </p>

                        {/* Metadata row */}
                        <div className="flex items-center gap-4 text-[11px]" style={{ color: C.muted }}>
                          {post.text_type && (
                            <span className="uppercase tracking-wider" style={{ opacity: 0.7 }}>{post.text_type}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <span>⏱</span> {Math.max(1, Math.ceil(htmlToPlainTextWithNewlines(post.content).length / 1200))} min
                          </span>
                        </div>

                        <div className="flex items-center gap-5 text-[11px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              void handleLike(post.id);
                            }}
                            disabled={likingIds.has(post.id) || !currentUserId}
                            className="inline-flex items-center gap-1.5 text-slate-300 transition-colors hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <span>♥</span>
                            <span className="tabular-nums text-slate-500">{getLikes(post.id)}</span>
                          </button>

                          <Link
                            href={`/post/${post.id}#comments`}
                            scroll
                            className="inline-flex items-center gap-1.5 text-slate-300 transition-colors hover:text-slate-600"
                          >
                            <span>✦</span>
                            <span className="tabular-nums text-slate-500">{getComments(post.id)}</span>
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 border-b border-slate-100/80 last:border-none" />
                  </article>
                ))}
              </div>

              <div ref={observerRef} className="h-4" />

              {loading && posts.length > 0 && (
                <p className="mt-10 text-center text-[12px] text-slate-300 tracking-wider uppercase">
                  Încărcare…
                </p>
              )}

              {/* CTA for anonymous users */}
              {!currentUserId && (
                <div className="mt-16 rounded-2xl border border-slate-200/60 bg-white/40 p-8 text-center">
                  <p className="text-[13px] text-slate-600 mb-4">
                    Creează cont pentru a salva texte și a primi recomandări personalizate.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300"
                    style={{
                      color: C.text,
                      border: `1.5px solid ${C.border}`,
                      background: C.surface,
                    }}
                  >
                    Conectează-te
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-12">
            {/* Header - What is this page */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 mb-3">
                Revistă literară
              </p>
              <h3 className="font-serif text-[22px] font-medium mb-2" style={{ color: C.text }}>
                Texte originale
              </h3>
              <p className="text-[13px] leading-relaxed text-slate-500">
                Poezie, proză scurtă, jurnal, eseuri și experimente din comunitate.
              </p>
              <div className="mt-4 h-px w-12" style={{ background: C.accent }} />
            </div>

            {/* Popular Today */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-4 flex items-center gap-1">
                🔥 Texte populare azi
              </p>
              <div className="space-y-3">
                {topViewedPosts.length === 0 ? (
                  <p className="text-[11px] text-slate-300">Se încarcă…</p>
                ) : (
                  topViewedPosts.slice(0, 4).map((post, idx) => (
                    <Link
                      key={`popular-${post.id}`}
                      href={`/post/${post.id}`}
                      className="block text-[13px] text-slate-600 hover:text-slate-900 transition-colors truncate"
                    >
                      {idx + 1}. {post.title}
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Most Appreciated */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-4 flex items-center gap-1">
                ❤️ Cele mai apreciate
              </p>
              <div className="space-y-3">
                {topViewedPosts.length === 0 ? (
                  <p className="text-[11px] text-slate-300">Se încarcă…</p>
                ) : (
                  topViewedPosts.slice(0, 3).map((post) => (
                    <Link
                      key={`appreciated-${post.id}`}
                      href={`/post/${post.id}`}
                      className="block text-[13px] text-slate-600 hover:text-slate-900 transition-colors truncate"
                    >
                      {post.title}
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Writing Challenge */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-4 flex items-center gap-1">
                ✍️ Provocare de scriere
              </p>
              <div className="rounded-2xl border border-slate-200/60 bg-white/50 p-5">
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  "Scrie o pagină despre ultima conversație pe care nu ai putut să o ai."
                </p>
                <Link
                  href="/create"
                  className="mt-4 inline-block text-[12px] font-medium"
                  style={{ color: C.accent }}
                >
                  Începe →
                </Link>
              </div>
            </div>

            {/* Quote */}
             <div className="rounded-2xl border border-slate-200/60 bg-white/40 p-6 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 mb-3">
                Citat aleatoriu
              </p>
              <p className="text-xs italic text-slate-600 leading-relaxed">
                « {sidebarQuote} »
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
