import { supabase } from "@/lib/supabaseClient";

export async function getProfile(userId: string) {
  return supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
}

export async function updateProfile(userId: string, data: any) {
  return supabase
    .from("profiles")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}