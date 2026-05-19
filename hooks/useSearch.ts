"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { SearchResult } from "@/lib/types";

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
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

    if (postError || userError) {
      console.error("SEARCH ERROR:", postError ?? userError);
    }

    const merged: SearchResult[] = [
      ...(posts || []).map((p) => ({
        type: "post" as const,
        ...p,
      })),
      ...(users || []).map((u) => ({
        type: "user" as const,
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
