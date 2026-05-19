import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Comment } from "@/lib/types";

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("LOAD COMMENTS ERROR:", error);
        return;
      }

      setComments((data || []) as Comment[]);
    }

    load();

    const channel = supabase
      .channel("comments-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          setComments((prev) => [...prev, payload.new as Comment]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  return comments;
}
