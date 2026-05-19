import { supabase } from "@/lib/supabaseClient";
import type { Post, Profile, UserRole } from "@/lib/types";

export type CreatePostInput = {
  title: string;
  content: string;
  user_id: string;
  file_hash?: string | null;
  version?: number;
  doc_url?: string | null;
  text_type?: string | null;
  genre?: string | null;
  uses_ai?: boolean | null;
};

export async function createPost(input: CreatePostInput): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: input.title,
      content: input.content,
      user_id: input.user_id,
      file_hash: input.file_hash ?? null,
      version: input.version ?? 1,
      doc_url: input.doc_url ?? null,
      text_type: input.text_type ?? null,
      genre: input.genre ?? null,
      uses_ai: input.uses_ai ?? null,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("createPost error:", error);
    throw error;
  }

  return data;
}

export async function updateProfileRole(
  userId: string,
  role: UserRole
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    console.error("updateProfileRole error:", error);
    return null;
  }

  return data;
}

export async function getAllUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllUsers error:", error);
    return [];
  }

  return data ?? [];
}

export async function getPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getPostById error:", error);
    return null;
  }

  return data;
}

export async function updatePost(
  id: string,
  content: string,
  version: number
): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .update({
      content,
      version: version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("version", version) // conflict protection
    .select("*")
    .single();

  if (error) {
    console.error("updatePost error:", error);
    throw error;
  }

  return data;
}

export async function listPosts(limit = 20): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listPosts error:", error);
    return [];
  }

  return data ?? [];
}
