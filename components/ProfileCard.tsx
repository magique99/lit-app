"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileCard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  // GET USER
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // LOAD PROFILE
  useEffect(() => {
    if (!userId) return;

    async function loadProfile() {
      setLoading(true);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      setProfile(data);

      if (data) {
        setUsername(data.username || "");
        setBio(data.bio || "");
      }

      setLoading(false);
    }

    loadProfile();
  }, [userId]);

  // CREATE PROFILE (NEW)
  async function createProfile() {
    if (!userId) return;

    setCreating(true);

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        user_id: userId,
        username,
        bio,
      })
      .select("*")
      .single();

    if (error) {
      console.error("CREATE PROFILE ERROR:", error);
      setCreating(false);
      return;
    }

    setProfile(data);
    setCreating(false);
  }

  // UPDATE PROFILE
  async function saveProfile() {
    await supabase
      .from("profiles")
      .update({
        username,
        bio,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    setProfile((p: any) => ({
      ...p,
      username,
      bio,
    }));
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  // =========================
  // NO PROFILE → CREATE FLOW
  // =========================
  if (!profile) {
    return (
      <div className="space-y-3">

        <h2 className="font-semibold">
          Creează profilul tău
        </h2>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="username"
        />

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="bio"
        />

        <button
          onClick={createProfile}
          disabled={creating}
          className="bg-black text-white px-3 py-1 rounded"
        >
          {creating ? "Creating..." : "Create profile"}
        </button>

      </div>
    );
  }

  // =========================
  // EXISTING PROFILE
  // =========================
  return (
    <div className="space-y-4">

      <h3 className="font-semibold text-lg">
        {profile.username}
      </h3>

      <p className="text-sm text-gray-600">
        {profile.bio}
      </p>

      <button
        onClick={saveProfile}
        className="text-blue-600 text-sm"
      >
        Save changes
      </button>

    </div>
  );
}