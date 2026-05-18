"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileEditorV2() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  // =========================
  // USER
  // =========================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // =========================
  // LOAD PROFILE (SAFE)
  // =========================
  useEffect(() => {
    if (!userId) return;

    async function loadProfile() {
      setLoading(true);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(); // IMPORTANT FIX

      setProfile(data);

      setUsername(data?.username || "");
      setBio(data?.bio || "");

      setLoading(false);
    }

    loadProfile();
  }, [userId]);

  // =========================
  // SAVE
  // =========================
  async function saveProfile() {
    if (!userId) return;

    await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        username,
        bio,
        updated_at: new Date().toISOString(),
      });

    setProfile((p: any) => ({
      ...p,
      username,
      bio,
    }));

    setEditMode(false);
  }

  // =========================
  // AVATAR UPLOAD (Instagram style UX)
  // =========================
  async function uploadAvatar(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!userId) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const path = `${userId}/avatar-${Date.now()}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (error) {
      console.error(error);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        avatar_url: data.publicUrl,
      });

    setProfile((p: any) => ({
      ...p,
      avatar_url: data.publicUrl,
    }));
  }

  // =========================
  // LOADING UI
  // =========================
  if (loading) {
    return (
      <div className="h-32 bg-gray-100 animate-pulse rounded-xl" />
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">

      {/* AVATAR ROW */}
      <div className="flex items-center gap-4">

        {/* AVATAR */}
        <div className="relative group w-16 h-16 rounded-full bg-gray-200 overflow-hidden">

          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold">
              {username?.[0]?.toUpperCase() || "U"}
            </div>
          )}

          {/* overlay edit */}
          <label className="
            absolute inset-0
            flex items-center justify-center
            text-xs text-white
            bg-black/40 opacity-0
            group-hover:opacity-100
            cursor-pointer
          ">
            Edit
            <input
              type="file"
              className="hidden"
              onChange={uploadAvatar}
            />
          </label>

        </div>

        {/* INFO */}
        <div className="flex-1">

          {!editMode ? (
            <>
              <h3 className="font-semibold text-lg">
                {profile?.username || "Fără nume"}
              </h3>

              <p className="text-sm text-gray-600 mt-1">
                {profile?.bio || "Fără bio"}
              </p>

              <button
                onClick={() => setEditMode(true)}
                className="text-sm text-blue-600 mt-2"
              >
                Edit profile
              </button>
            </>
          ) : (
            <div className="space-y-2">

              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                className="w-full border rounded-xl p-2"
                placeholder="username"
              />

              <textarea
                value={bio}
                onChange={(e) =>
                  setBio(e.target.value)
                }
                className="w-full border rounded-xl p-2"
                placeholder="bio"
              />

              <div className="flex gap-2">

                <button
                  onClick={saveProfile}
                  className="bg-black text-white px-3 py-1 rounded-xl"
                >
                  Save
                </button>

                <button
                  onClick={() => setEditMode(false)}
                  className="text-gray-500 text-sm"
                >
                  Cancel
                </button>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}