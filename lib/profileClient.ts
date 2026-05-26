import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

export async function getProfile(userId: string) {
  return supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
}

export async function updateProfile(
  userId: string,
  data: Partial<Omit<Profile, "id" | "user_id">>
) {
  return supabase
    .from("profiles")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}
