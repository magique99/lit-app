"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

export default function ProfileCardV3() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [edit, setEdit] = useState(false);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // =========================
  // USER
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

    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setProfile((data as Profile | null) ?? null);
        setUsername(data?.username || "");
        setBio(data?.bio || "");
      });
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

    setProfile((p) => ({
      ...(p ?? { user_id: userId }),
      username,
      bio,
    }));
    setEdit(false);
  }

  // =========================
  // AVATAR UPLOAD (premium UX)
  // =========================
  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    if (!userId) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);

    const path = `${userId}/avatar-${Date.now()}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (error) {
      console.error(error);
      setUploadingAvatar(false);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("user_id", userId);

    setProfile((p) => ({
      ...(p ?? { user_id: userId, username: "" }),
      avatar_url: data.publicUrl,
    }));

    setUploadingAvatar(false);
  }

  if (!profile) return <div>Loading...</div>;

  // =========================
  // PROFILE COMPLETION %
  // =========================
  const completion = Math.min(
    100,
    [profile.username, profile.bio, profile.avatar_url].filter(Boolean).length * 33
  );

  return (
    <div className="space-y-4">

      {/* =========================
          COVER BANNER (fake but premium UI)
      ========================= */}
      <div className="h-24 rounded-xl bg-gradient-to-r from-gray-800 to-gray-600" />

      {/* =========================
          AVATAR + ACTIONS
      ========================= */}
      <div className="flex items-end gap-4 -mt-10 px-3">

        <div className="relative group">

          <div className="w-20 h-20 rounded-full bg-gray-200 border-4 border-white overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username || "Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold">
                U
              </div>
            )}
          </div>

          {/* hover edit */}
          <label className="absolute inset-0 flex items-center justify-center text-xs text-white bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer rounded-full">
            {uploadingAvatar ? "..." : "Edit"}
            <input
              type="file"
              className="hidden"
              onChange={uploadAvatar}
            />
          </label>

        </div>

        {/* NAME + PROGRESS */}
        <div className="flex-1">

          <h2 className="font-bold text-lg">
            {profile.username || "Fără nume"}
          </h2>

          <div className="text-xs text-gray-500 mt-1">
            Profile completion: {completion}%
          </div>

          <div className="w-full h-1 bg-gray-200 rounded mt-1">
            <div
              className="h-1 bg-black rounded"
              style={{ width: `${completion}%` }}
            />
          </div>

        </div>

      </div>

      {/* =========================
          VIEW MODE
      ========================= */}
      {!edit && (
        <div className="px-3 space-y-3">

          <p className="text-sm text-gray-600">
            {profile.bio || "No bio yet"}
          </p>

          <button
            onClick={() => setEdit(true)}
            className="text-sm text-blue-600"
          >
            Edit profile
          </button>

        </div>
      )}

      {/* =========================
          EDIT MODE
      ========================= */}
      {edit && (
        <div className="px-3 space-y-3">

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
