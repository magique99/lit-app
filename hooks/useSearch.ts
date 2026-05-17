"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useSearch() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(query: string) {
    const q = query.trim();

    if (!q) {
      setResults([]);
      return;
    }

    setLoading(true);

    // POSTS
    const { data: posts, error: postError } = await supabase
      .from("posts")
      .select("id, title")
      .ilike("title", `%${q}%`);

    // USERS
    const { data: users, error: userError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .ilike("username", `%${q}%`);

    console.log("SEARCH POSTS:", posts, postError);
    console.log("SEARCH USERS:", users, userError);

    const merged = [
      ...(posts || []).map((p) => ({
        type: "post",
        ...p,
      })),
      ...(users || []).map((u) => ({
        type: "user",
        ...u,
      })),
    ];

    setResults(merged);
    setLoading(false);
  }

  return {
    results,
    loading,
    search,
  };
}