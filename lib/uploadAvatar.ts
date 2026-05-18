import { supabase } from "@/lib/supabaseClient";

export async function uploadAvatar(file: File, userId: string) {
  const path = `${userId}/avatar-${Date.now()}.${file.name.split(".").pop()}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  return data.publicUrl;
}