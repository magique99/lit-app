import { supabase } from "@/lib/supabaseClient";

export async function uploadAvatar(file: File, userId: string) {
  const path = `${userId}/avatar-${Date.now()}.${file.name.split(".").pop()}`;

  try {
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
  } catch (error: any) {
    // If avatars bucket doesn't exist, fall back to documents bucket
    if (error?.message?.includes('Bucket not found')) {
      try {
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(path, file, {
            upsert: true,
            cacheControl: "3600",
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("documents")
          .getPublicUrl(path);

        return data.publicUrl;
      } catch (fallbackError) {
        console.error("AVATAR UPLOAD FALLBACK ERROR:", fallbackError);
        throw new Error("Nu am putut încărca avatarul. Bucket-ul de stocare nu este configurat corect.");
      }
    } else {
      console.error("AVATAR UPLOAD ERROR:", error);
      throw error;
    }
  }
}