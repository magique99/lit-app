"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileCard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [edit, setEdit] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  // =========================
  // GET USER
  // =========================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // =========================
  // LOAD PROFILE (FIXED)
  // =========================
  useEffect(() => {
    if (!userId) return;

    async function loadProfile() {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("PROFILE LOAD ERROR:", error);
      }

      setProfile(data);
      setUsername(data?.username || "");
      setBio(data?.bio || "");
      setLoading(false);
    }

    loadProfile();
  }, [userId]);

  // =========================
  // SAVE PROFILE
  // =========================
  async function saveProfile() {
    if (!userId) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        bio,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("SAVE ERROR:", error);
      return;
    }

    setProfile((p: any) => ({
      ...p,
      username,
      bio,
    }));

    setEdit(false);
  }

  // =========================
  // UPLOAD AVATAR
  // =========================
  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    if (!userId) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const path = `${userId}/avatar-${Date.now()}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const avatarUrl = data.publicUrl;

    await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("user_id", userId);

    setProfile((p: any) => ({
      ...p,
      avatar_url: avatarUrl,
    }));
  }

  // =========================
  // UI STATES
  // =========================
  if (loading) {
    return <div className="text-sm text-gray-500">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="text-sm text-gray-500">
        Profilul nu există încă.
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* AVATAR */}
      <div className="flex items-center gap-4">

        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold">
              {profile.username?.[0]?.toUpperCase() || "U"}
            </span>
          )}
        </div>

        <label className="text-sm text-blue-600 cursor-pointer">
          Adaugă / Editează avatar
          <input
            type="file"
            className="hidden"
            onChange={uploadAvatar}
          />
        </label>

      </div>

      {/* INFO */}
      {!edit ? (
        <div>
          <h3 className="font-semibold text-lg">
            {profile.username || "Fără nume"}
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            {profile.bio || "Fără bio"}
          </p>

          <button
            onClick={() => setEdit(true)}
            className="mt-4 text-sm text-blue-600"
          >
            Edit profil
          </button>
        </div>
      ) : (
        <div className="space-y-3">

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

          <div className="flex gap-2">

            <button
              onClick={saveProfile}
              className="bg-black text-white px-3 py-1 rounded"
            >
              Save
            </button>

            <button
              onClick={() => setEdit(false)}
              className="text-gray-500 text-sm"
            >
              Cancel
            </button>

          </div>

        </div>
      )}

    </div>
  );
}