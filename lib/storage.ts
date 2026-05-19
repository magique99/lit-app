import { supabase } from "@/lib/supabaseClient";

export async function uploadDocx(file: File, userId: string) {
  const path = `${userId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

  if (error) {
    console.error("UPLOAD ERROR:", error);
    throw error;
  }

  const { data: signed } = await supabase.storage
    .from("documents")
    .createSignedUrl(path, 60 * 60);

  return {
    path,
    signedUrl: signed?.signedUrl ?? null,
  };
}
