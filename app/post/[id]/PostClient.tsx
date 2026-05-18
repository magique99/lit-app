"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type CommentType = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  optimistic?: boolean;
  profiles?: {
    username?: string;
  } | null;
};

export default function PostClient({
  postId,
}: {
  postId: string;
}) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [text, setText] = useState("");

  const [sending, setSending] = useState(false);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [postLikes, setPostLikes] = useState<any[]>([]);
  const [postLiked, setPostLiked] = useState(false);

  const [commentLikes, setCommentLikes] =
    useState<any[]>([]);

  const [typingUsers, setTypingUsers] =
    useState<string[]>([]);

  const typingChannel = useRef<any>(null);
  const typingTimeout = useRef<any>(null);

  // ===================================
  // USER
  // ===================================
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("CURRENT USER:", user);

      setCurrentUserId(user?.id ?? null);
    }

    getUser();
  }, []);

  // ===================================
  // LOAD COMMENTS
  // ===================================
  async function loadComments() {
    console.log("Loading comments...");

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "LOAD COMMENTS ERROR",
        error
      );
      return;
    }

    const list = data || [];

    const userIds = [
      ...new Set(list.map((c) => c.user_id)),
    ];

    let profiles: any[] = [];

    if (userIds.length) {
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      profiles = p || [];
    }

    const merged = list.map((c) => ({
      ...c,
      profiles:
        profiles.find(
          (p) => p.id === c.user_id
        ) ?? null,
    }));

    setComments(merged);
  }

  // ===================================
  // LOAD LIKES
  // ===================================
  async function loadLikes() {
    const [{ data: postL }, { data: commentL }] =
      await Promise.all([
        supabase
          .from("post_likes")
          .select("*")
          .eq("post_id", postId),

        supabase
          .from("comment_likes")
          .select("*"),
      ]);

    setPostLikes(postL || []);
    setCommentLikes(commentL || []);

    if (currentUserId) {
      setPostLiked(
        (postL || []).some(
          (l) =>
            l.user_id === currentUserId
        )
      );
    }
  }

  // ===================================
  // INIT
  // ===================================
  useEffect(() => {
    loadComments();
  }, [postId]);

  useEffect(() => {
    loadLikes();
  }, [postId, currentUserId]);

  // ===================================
  // REALTIME COMMENTS
  // ===================================
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
          const c = payload.new as CommentType;

          console.log(
            "REALTIME COMMENT",
            c
          );

          setComments((prev) => {
            const exists = prev.some(
              (x) => x.id === c.id
            );

            if (exists) return prev;

            const optimisticIndex =
              prev.findIndex(
                (x) =>
                  x.optimistic &&
                  x.user_id === c.user_id &&
                  x.content === c.content
              );

            if (
              optimisticIndex !== -1
            ) {
              const clone = [...prev];

              clone[
                optimisticIndex
              ] = c;

              return clone;
            }

            return [c, ...prev];
          });

          const { data: profile } =
            await supabase
              .from("profiles")
              .select("*")
              .eq("id", c.user_id)
              .maybeSingle();

          setComments((prev) =>
            prev.map((x) =>
              x.id === c.id
                ? {
                    ...x,
                    profiles:
                      profile ?? null,
                  }
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

  // ===================================
  // REALTIME TYPING
  // ===================================
  useEffect(() => {
    if (!currentUserId) return;

    const channel =
      supabase.channel(
        `typing-${postId}`,
        {
          config: {
            presence: {
              key: currentUserId,
            },
          },
        }
      );

    typingChannel.current =
      channel;

    channel
      .on(
        "presence",
        { event: "sync" },
        () => {
          const state =
            channel.presenceState();

          setTypingUsers(
            Object.keys(
              state
            ).filter(
              (id) =>
                id !== currentUserId
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [postId, currentUserId]);

  function handleTyping() {
    if (!typingChannel.current)
      return;

    typingChannel.current.track({
      typing: true,
    });

    clearTimeout(
      typingTimeout.current
    );

    typingTimeout.current =
      setTimeout(() => {
        typingChannel.current?.untrack();
      }, 1000);
  }

  // ===================================
  // ADD COMMENT
  // ===================================
  async function addComment() {
    try {
      console.log(
        "SEND CLICKED"
      );

      if (!currentUserId) {
        alert(
          "Trebuie să fii logat"
        );
        return;
      }

      if (!text.trim()) return;

      setSending(true);

      const value = text.trim();

      setText("");

      const tempId =
        crypto.randomUUID();

      const optimistic: CommentType =
        {
          id: tempId,
          post_id: postId,
          user_id:
            currentUserId,
          content: value,
          created_at:
            new Date().toISOString(),
          optimistic: true,
          profiles: {
            username: "you",
          },
        };

      setComments((prev) => [
        optimistic,
        ...prev,
      ]);

      console.log(
        "INSERTING COMMENT..."
      );

      const {
        data,
        error,
      } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id:
            currentUserId,
          content: value,
        })
        .select("*")
        .single();

      console.log(
        "INSERT RESULT:",
        data,
        error
      );

      if (error) {
        throw error;
      }

      const {
        data: profile,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          currentUserId
        )
        .maybeSingle();

      setComments((prev) =>
        prev.map((c) =>
          c.id === tempId
            ? {
                ...data,
                profiles:
                  profile ??
                  null,
              }
            : c
        )
      );
    } catch (err) {
      console.error(
        "ADD COMMENT ERROR",
        err
      );

      alert(
        "Nu s-a putut trimite comentariul"
      );
    } finally {
      setSending(false);
    }
  }

  // ===================================
  // LIKES
  // ===================================
  async function togglePostLike() {
    if (!currentUserId) return;

    if (postLiked) {
      setPostLiked(false);

      setPostLikes((p) =>
        p.filter(
          (l) =>
            l.user_id !==
            currentUserId
        )
      );

      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq(
          "user_id",
          currentUserId
        );
    } else {
      setPostLiked(true);

      setPostLikes((p) => [
        ...p,
        {
          post_id: postId,
          user_id:
            currentUserId,
        },
      ]);

      await supabase
        .from("post_likes")
        .insert({
          post_id: postId,
          user_id:
            currentUserId,
        });
    }
  }

  async function toggleCommentLike(
    commentId: string
  ) {
    if (!currentUserId) return;

    const exists =
      commentLikes.find(
        (l) =>
          l.comment_id ===
            commentId &&
          l.user_id ===
            currentUserId
      );

    if (exists) {
      setCommentLikes((p) =>
        p.filter(
          (l) =>
            !(
              l.comment_id ===
                commentId &&
              l.user_id ===
                currentUserId
            )
        )
      );

      await supabase
        .from(
          "comment_likes"
        )
        .delete()
        .eq(
          "comment_id",
          commentId
        )
        .eq(
          "user_id",
          currentUserId
        );
    } else {
      setCommentLikes((p) => [
        ...p,
        {
          comment_id:
            commentId,
          user_id:
            currentUserId,
        },
      ]);

      await supabase
        .from(
          "comment_likes"
        )
        .insert({
          comment_id:
            commentId,
          user_id:
            currentUserId,
        });
    }
  }

  const getCommentLikes = (
    id: string
  ) =>
    commentLikes.filter(
      (l) =>
        l.comment_id === id
    ).length;

  const isCommentLiked = (
    id: string
  ) =>
    commentLikes.some(
      (l) =>
        l.comment_id === id &&
        l.user_id ===
          currentUserId
    );

  // ===================================
  // UI
  // ===================================
  return (
    <div className="mt-10 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={
            togglePostLike
          }
          className="text-2xl"
        >
          {postLiked
            ? "❤️"
            : "🤍"}
        </button>

        <span className="text-sm text-gray-600">
          {postLikes.length} likes
        </span>
      </div>

      {typingUsers.length >
        0 && (
        <div className="text-xs italic text-gray-500">
          Someone is typing...
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => {
            setText(
              e.target.value
            );
            handleTyping();
          }}
          onKeyDown={(
            e
          ) => {
            if (
              e.key ===
                "Enter" &&
              !e.shiftKey
            ) {
              e.preventDefault();
              addComment();
            }
          }}
          rows={2}
          className="flex-1 border rounded-xl p-3"
          placeholder="Scrie un comentariu..."
        />

        <button
          onClick={
            addComment
          }
          disabled={
            sending
          }
          className="bg-black text-white px-5 rounded-xl"
        >
          {sending
            ? "..."
            : "Send"}
        </button>
      </div>

      <div className="space-y-4">
        {comments.map(
          (c) => (
            <div
              key={c.id}
              className="flex gap-3 border rounded-2xl p-4"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                {c.profiles?.username?.[0]?.toUpperCase() ??
                  "U"}
              </div>

              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">
                    {c
                      .profiles
                      ?.username ??
                      "user"}
                  </span>

                  <span>
                    {new Date(
                      c.created_at
                    ).toLocaleString()}
                  </span>
                </div>

                <p className="mt-2 text-sm">
                  {c.content}
                </p>

                <div className="flex gap-2 mt-2 items-center">
                  <button
                    onClick={() =>
                      toggleCommentLike(
                        c.id
                      )
                    }
                  >
                    {isCommentLiked(
                      c.id
                    )
                      ? "❤️"
                      : "🤍"}
                  </button>

                  <span className="text-xs text-gray-500">
                    {getCommentLikes(
                      c.id
                    )}{" "}
                    likes
                  </span>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}