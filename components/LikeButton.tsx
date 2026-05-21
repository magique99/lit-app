"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LikeButton({ postId }: { postId: string }) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    const loadLikes = async () => {
      const [likesRes, userLikeRes] = await Promise.all([
        supabase.from("likes").select("id").eq("post_id", postId),
        userId
          ? supabase
              .from("likes")
              .select("id")
              .eq("post_id", postId)
              .eq("user_id", userId)
              .maybeSingle()
          : { data: null },
      ]);

      setCount(likesRes.data?.length ?? 0);
      setLiked(!!userLikeRes.data);
    };
    loadLikes();
  }, [postId, userId]);

  const handleLike = async () => {
    if (!userId) return;
    setLoading(true);
    if (liked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      setCount((c) => c - 1);
    } else {
      const { data: postData } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .single();
      
      await supabase.from("likes").insert({ post_id: postId, user_id: userId });
      setCount((c) => c + 1);

      if (postData && postData.user_id && postData.user_id !== userId) {
        await supabase.from("notifications").insert({
          user_id: postData.user_id,
          actor_id: userId,
          post_id: postId,
          type: "like_post",
        });
      }
    }
    setLiked(!liked);
    setLoading(false);
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading || !userId}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span>{liked ? "❤️" : "🤍"}</span>
      <span>{count}</span>
    </button>
  );
}