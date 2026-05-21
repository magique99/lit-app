"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Comment, CommentWithProfile } from "@/lib/types";

export default function PostClient({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [text, setText] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const typingChannel = useRef<RealtimeChannel | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // =========================
  // USER
  // =========================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // =========================
  // LOAD COMMENTS
  // =========================
  const loadComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD COMMENTS ERROR:", error);
      setErrorMessage("Nu am putut încărca comentariile.");
      return;
    }

    const list = (data as Comment[]) || [];

    const userIds = [...new Set(list.map((c) => c.user_id))];

    const { data: profiles } = userIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", userIds)
      : { data: [] };

    const merged = list.map((c) => ({
      ...c,
      profiles: (profiles ?? []).find(
        (p) => p.user_id === c.user_id
      ),
    }));

    setComments(merged);
  }, [postId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadComments();
    });
  }, [loadComments]);

  // =========================
  // REALTIME COMMENTS
  // =========================
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const c = payload.new as Comment;

          setComments((prev) => {
            if (prev.some((x) => x.id === c.id)) return prev;
            return [c, ...prev];
          });

          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, username, avatar_url")
            .eq("user_id", c.user_id)
            .maybeSingle();

          setComments((prev) =>
            prev.map((x) =>
              x.id === c.id
                ? { ...x, profiles: profile ?? null }
                : x
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  // =========================
  // TYPING
  // =========================
  function handleTyping() {
    if (!typingChannel.current) return;

    typingChannel.current.track({ typing: true });

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      typingChannel.current?.untrack();
    }, 1000);
  }

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel(`typing-${postId}`, {
      config: { presence: { key: currentUserId } },
    });

    typingChannel.current = channel;

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, postId]);

  // =========================
  // ADD COMMENT (FIXED)
  // =========================
  async function addComment() {
    if (!currentUserId) {
      setErrorMessage("Trebuie să fii logat ca să comentezi.");
      return;
    }

    if (!text.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    const value = text;
    const tempId = crypto.randomUUID();

    setComments((p) => [
      {
        id: tempId,
        post_id: postId,
        user_id: currentUserId,
        content: value,
        created_at: new Date().toISOString(),
        profiles: { username: "tu", avatar_url: null },
      },
      ...p,
    ]);

    setText("");

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: currentUserId,
        content: value,
      })
      .select("*")
      .single();

    setLoading(false);

    if (error) {
      console.error("INSERT ERROR:", error);
      setComments((p) => p.filter((c) => c.id !== tempId));
      setErrorMessage("Nu s-a putut trimite comentariul.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", currentUserId)
      .maybeSingle();

    setComments((prev) =>
      prev.map((c) =>
        c.id === tempId
          ? { ...data, profiles: profile }
          : c
      )
    );

    const { data: postData } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (postData && postData.user_id && postData.user_id !== currentUserId) {
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: postData.user_id,
        actor_id: currentUserId,
        post_id: postId,
        comment_id: data.id,
        type: "comment",
      });
      if (notifError) {
        console.error("NOTIFICATION ERROR:", notifError);
      }
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="mt-10 space-y-8">

      {errorMessage && (
        <div className="rounded-3xl border border-red-200 bg-red-50/90 px-5 py-4 text-sm text-rose-700 shadow-sm">
          {errorMessage}
        </div>
      )}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Comentarii</h2>
            <p className="text-sm text-slate-500">{comments.length} comentarii</p>
          </div>
          <button
            onClick={() => {
              if (!currentUserId) {
                setErrorMessage("Trebuie să fii logat ca să comentezi.");
              }
            }}
            className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-[#f8f4ee] sm:inline-flex"
          >
            Exprima-ți opinia
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            className="min-h-[140px] w-full rounded-[1.75rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
            placeholder="Scrie un comentariu..."
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => void addComment()}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Se trimite..." : "Trimite comentariu"}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {comments.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-[#fcf5ec] p-8 text-center text-sm text-slate-600 shadow-sm">
            Fii primul care lasă un comentariu pentru acest text.
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-full bg-[#f5ece1]">
                  {c.profiles?.avatar_url ? (
                    <Image
                      src={c.profiles.avatar_url}
                      alt={c.profiles?.username ?? "Avatar"}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm text-slate-500">{c.profiles?.username?.[0]?.toUpperCase() ?? "U"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                    <span className="font-semibold">{c.profiles?.username ?? "Utilizator"}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400">{new Date(c.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-700 whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
