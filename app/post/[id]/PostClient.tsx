"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PostClient({ postId }: { postId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [postLikes, setPostLikes] = useState<any[]>([]);
  const [postLiked, setPostLiked] = useState(false);

  const [commentLikes, setCommentLikes] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const typingChannel = useRef<any>(null);
  const typingTimeout = useRef<any>(null);

  // =========================
  // USER
  // =========================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // =========================
  // LOAD COMMENTS (with profiles)
  // =========================
  async function loadComments() {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    const list = data || [];

    const userIds = [...new Set(list.map((c) => c.user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    const merged = list.map((c) => ({
      ...c,
      profiles: profiles?.find((p) => p.id === c.user_id),
    }));

    setComments(merged);
  }

  // =========================
  // LOAD LIKES
  // =========================
  async function loadLikes() {
    const [{ data: postL }, { data: commentL }] = await Promise.all([
      supabase.from("post_likes").select("*").eq("post_id", postId),
      supabase.from("comment_likes").select("*"),
    ]);

    setPostLikes(postL || []);

    if (currentUserId) {
      setPostLiked(
        (postL || []).some((l) => l.user_id === currentUserId)
      );
    }

    setCommentLikes(commentL || []);
  }

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    loadComments();
    loadLikes();
  }, [postId, currentUserId]);

  // =========================
  // REALTIME COMMENTS (DEDUPED)
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
          const c = payload.new as any;

          setComments((prev) => {
            if (prev.some((x) => x.id === c.id)) return prev;
            return [c, ...prev];
          });

          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", c.user_id)
            .single();

          setComments((prev) =>
            prev.map((x) =>
              x.id === c.id ? { ...x, profiles: profile } : x
            )
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [postId]);

  // =========================
  // REALTIME TYPING (PRESENCE)
  // =========================
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel(`typing-${postId}`, {
      config: {
        presence: { key: currentUserId },
      },
    });

    typingChannel.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setTypingUsers(
          Object.keys(state).filter((id) => id !== currentUserId)
        );
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUserId, postId]);

  function handleTyping() {
    if (!typingChannel.current) return;

    typingChannel.current.track({ typing: true });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      typingChannel.current?.untrack();
    }, 1000);
  }

  // =========================
  // POST LIKE (TOGGLE)
  // =========================
  async function togglePostLike() {
    if (!currentUserId) return;

    if (postLiked) {
      setPostLiked(false);
      setPostLikes((p) =>
        p.filter((l) => l.user_id !== currentUserId)
      );

      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId);
    } else {
      setPostLiked(true);
      setPostLikes((p) => [
        ...p,
        { post_id: postId, user_id: currentUserId },
      ]);

      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: currentUserId,
      });
    }
  }

  // =========================
  // COMMENT LIKE
  // =========================
  async function toggleCommentLike(commentId: string) {
    if (!currentUserId) return;

    const exists = commentLikes.find(
      (l) =>
        l.comment_id === commentId &&
        l.user_id === currentUserId
    );

    if (exists) {
      setCommentLikes((p) =>
        p.filter(
          (l) =>
            !(
              l.comment_id === commentId &&
              l.user_id === currentUserId
            )
        )
      );

      await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", currentUserId);
    } else {
      setCommentLikes((p) => [
        ...p,
        { comment_id: commentId, user_id: currentUserId },
      ]);

      await supabase.from("comment_likes").insert({
        comment_id: commentId,
        user_id: currentUserId,
      });
    }
  }

  const getCommentLikes = (id: string) =>
    commentLikes.filter((l) => l.comment_id === id).length;

  const isCommentLiked = (id: string) =>
    commentLikes.some(
      (l) =>
        l.comment_id === id &&
        l.user_id === currentUserId
    );

  // =========================
  // ADD COMMENT (OPTIMISTIC)
  // =========================
  async function addComment() {
    if (!currentUserId || !text.trim()) return;

    const tempId = crypto.randomUUID();

    const optimistic = {
      id: tempId,
      post_id: postId,
      user_id: currentUserId,
      content: text,
      created_at: new Date().toISOString(),
      profiles: { username: "you" },
    };

    setComments((p) => [optimistic, ...p]);

    const value = text;
    setText("");

    const { data } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: currentUserId,
        content: value,
      })
      .select("*")
      .single();

    if (data) {
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
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="mt-10 space-y-6">

      {/* POST LIKE */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePostLike}
          className="text-2xl active:scale-95 transition"
        >
          {postLiked ? "❤️" : "🤍"}
        </button>

        <span className="text-sm text-gray-600">
          {postLikes.length} likes
        </span>
      </div>

      {/* TYPING */}
      {typingUsers.length > 0 && (
        <div className="text-xs text-gray-500 italic">
          {typingUsers.length === 1
            ? "Someone is typing..."
            : `${typingUsers.length} people are typing...`}
        </div>
      )}

      {/* INPUT */}
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              addComment();
            }
          }}
          className="flex-1 border rounded-xl px-3 py-2 resize-none"
          rows={2}
          placeholder="Scrie un comentariu..."
        />

        <button
          onClick={addComment}
          className="bg-black text-white px-4 rounded-xl"
        >
          Send
        </button>
      </div>

      {/* COMMENTS */}
      <div className="space-y-4">

        {comments.map((c) => (
            <div
              key={`${c.id}-${c.created_at}`}
            >
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-semibold">
              {c.profiles?.username?.[0]?.toUpperCase() || "U"}
            </div>

            <div className="flex-1">

              <div className="flex justify-between text-xs text-gray-500">
                <span className="font-medium text-gray-700">
                  {c.profiles?.username || "user"}
                </span>

                <span>
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>

              <p className="text-sm mt-1">{c.content}</p>

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => toggleCommentLike(c.id)}
                >
                  {isCommentLiked(c.id) ? "❤️" : "🤍"}
                </button>

                <span className="text-xs text-gray-500">
                  {getCommentLikes(c.id)} likes
                </span>
              </div>

            </div>

          </div>
        ))}

      </div>
    </div>
  );
}