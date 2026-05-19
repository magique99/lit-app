"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Comment, CommentWithProfile, Profile } from "@/lib/types";

export default function PostClient({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [text, setText] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      return;
    }

    const list = (data || []) as Comment[];

    const userIds = [...new Set(list.map((c) => c.user_id))];

    const { data: profiles } = userIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", userIds)
      : { data: [] };

    const merged = list.map((c) => ({
      ...c,
      profiles: ((profiles ?? []) as Profile[]).find(
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
                ? { ...x, profiles: (profile as Profile | null) ?? null }
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
      alert("Trebuie să fii logat");
      return;
    }

    if (!text.trim()) return;

    setLoading(true);

    const value = text;

    // optional optimistic
    const tempId = crypto.randomUUID();

    setComments((p) => [
      {
        id: tempId,
        post_id: postId,
        user_id: currentUserId,
        content: value,
        created_at: new Date().toISOString(),
        profiles: { username: "you" },
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

      // rollback optimistic UI
      setComments((p) => p.filter((c) => c.id !== tempId));

      alert("Nu s-a putut trimite comentariul");
      return;
    }

    // replace temp with real DB row
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUserId)
      .single();

    setComments((prev) =>
      prev.map((c) =>
        c.id === tempId
          ? { ...data, profiles: profile }
          : c
      )
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="mt-10 space-y-4">

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          className="flex-1 border p-2 rounded"
          rows={2}
          placeholder="Scrie un comentariu..."
        />

        <button
          onClick={addComment}
          disabled={loading}
          className="bg-black text-white px-4 rounded"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="border p-3 rounded">
            <div className="text-xs text-gray-500">
              {c.profiles?.username || "user"}
            </div>

            <div>{c.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
