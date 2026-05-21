import { supabase } from "@/lib/supabaseClient";

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  const path = `${userId}/avatar-${Date.now()}.${file.name.split(".").pop()}`;

  // Try avatars bucket first
  try {
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        upsert: true,
        cacheControl: "3600",
      });

    if (!error) {
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      return data.publicUrl;
    }
    
    // If bucket not found error, try documents bucket
    if (error?.message?.includes('Bucket not found')) {
      try {
        const { error: docError } = await supabase.storage
          .from("documents")
          .upload(path, file, {
            upsert: true,
            cacheControl: "3600",
            contentType: file.type,
          });

        if (!docError) {
          const { data } = supabase.storage
            .from("documents")
            .getPublicUrl(path);
          return data.publicUrl;
        }
      } catch (docError) {
        // Documents bucket also failed, continue below
      }
    }
  } catch (avatarError) {
    // Avatars bucket had some other error, try documents
    try {
      const { error: docError } = await supabase.storage
        .from("documents")
        .upload(path, file, {
          upsert: true,
          cacheControl: "3600",
          contentType: file.type,
        });

      if (!docError) {
        const { data } = supabase.storage
          .from("documents")
          .getPublicUrl(path);
        return data.publicUrl;
      }
    } catch (docError) {
      // Both buckets failed, continue below
    }
  }

  // If storage fails, return null - caller should handle with base64 fallback
  return null;
}