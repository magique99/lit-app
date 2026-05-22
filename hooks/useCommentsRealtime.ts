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

      setComments(data || []);
    }

    load();

    let removeChannel: (() => void) | undefined;

     (async () => {
       try {
         const channel = supabase
           .channel(`comments-realtime-${postId}`)
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
             },
           );

         await channel.subscribe();

         removeChannel = () => {
           void supabase.removeChannel(channel).catch(() => {});
         };
       } catch (err) {
         console.error("Comments realtime setup failed:", err);
       }
     })();

    return () => {
      removeChannel?.();
    };
  }, [postId]);

  return comments;
}
