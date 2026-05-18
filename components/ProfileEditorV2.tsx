"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileEditorV2() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const [editMode, setEditMode] = useState(false);
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
  // LOAD PROFILE
  // =========================
  useEffect(() => {
    if (!userId) return;

    async function loadProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      setProfile(data);
      setUsername(data?.username || "");
      setBio(data?.bio || "");
    }

    loadProfile();
  }, [userId]);

  // =========================
  // SAVE PROFILE
  // =========================
  async function saveProfile() {
    if (!userId) return;

    await supabase
      .from("profiles")
      .update({
        username,
        bio,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    setEditMode(false);
  }

  // =========================
  // UPLOAD AVATAR
  // =========================
  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    if (!userId) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const path = `${userId}/avatar-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    await supabase
      .from("profiles")
      .update({
        avatar_url: data.publicUrl,
      })
      .eq("user_id", userId);

    setProfile((p: any) => ({
      ...p,
      avatar_url: data.publicUrl,
    }));
  }

  // =========================
  // UI
  // =========================
  if (!profile) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">

      {/* AVATAR */}
      <div className="flex items-center gap-3">
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

        <label className="text-xs text-blue-500 cursor-pointer">
          Adaugă avatar
          <input
            type="file"
            className="hidden"
            onChange={uploadAvatar}
          />
        </label>
      </div>

      {/* VIEW MODE */}
      {!editMode && (
        <div className="space-y-2">
          <h3 className="font-semibold">
            {profile.username || "Fără nume"}
          </h3>

          <p className="text-sm text-gray-600">
            {profile.bio || "Fără bio"}
          </p>

          <button
            onClick={() => setEditMode(true)}
            className="text-sm text-blue-600"
          >
            Edit profil
          </button>
        </div>
      )}

      {/* EDIT MODE */}
      {editMode && (
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
              onClick={() => setEditMode(false)}
              className="text-sm text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}