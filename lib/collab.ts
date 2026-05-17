import * as Y from "yjs";
import { supabase } from "@/lib/supabaseClient";

export function createCollabDoc(postId: string) {
  const doc = new Y.Doc();

  const channel = supabase.channel(`post:${postId}`);

  channel
    .on("broadcast", { event: "yjs-update" }, ({ payload }) => {
      Y.applyUpdate(doc, new Uint8Array(payload.update));
    })
    .subscribe();

  return {
    doc,
    sendUpdate: (update: Uint8Array) => {
      channel.send({
        type: "broadcast",
        event: "yjs-update",
        payload: { update },
      });
    },
  };
}