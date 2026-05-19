"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

export default function ProfileCard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      setLoading(true);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      setProfile((data as Profile | null) ?? null);

      if (data) {
        setUsername(data.username || "");
        setBio(data.bio || "");
      }

      setLoading(false);
    }

    load();
  }, [userId]);

  async function saveProfile() {
    if (!userId) return;

    await supabase
      .from("profiles")
      .update({
        username,
        bio,
      })
      .eq("user_id", userId);

    setProfile((p) => ({
      ...(p ?? { user_id: userId }),
      username,
      bio,
    }));

    setEdit(false);
  }

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

    if (error) return;

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
  }

  if (loading) {
    return (
      <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />
    );
  }

  if (!profile) {
    return (
      <div className="text-sm text-gray-500">
        No profile found
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">

      {/* HEADER */}
      <div className="flex items-center gap-4">

        {/* AVATAR */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 overflow-hidden border border-gray-100">

          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username || "Avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full font-bold text-gray-500">
              {profile.username?.[0]?.toUpperCase() || "U"}
            </div>
          )}

          {/* upload overlay (Instagram style) */}
          <label className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center cursor-pointer transition">
            <input
              type="file"
              className="hidden"
              onChange={uploadAvatar}
            />
          </label>

        </div>

        {/* INFO */}
        <div className="flex-1">

          {!edit ? (
            <>
              <h2 className="text-lg font-semibold">
                {profile.username}
              </h2>

              <p className="text-sm text-gray-600 mt-1">
                {profile.bio || "No bio yet"}
              </p>

              <button
                onClick={() => setEdit(true)}
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
                className="
                  w-full border
                  rounded-xl p-2 text-sm
                "
                placeholder="username"
              />

              <textarea
                value={bio}
                onChange={(e) =>
                  setBio(e.target.value)
                }
                className="
                  w-full border
                  rounded-xl p-2 text-sm
                "
                placeholder="bio"
              />

              <div className="flex gap-2">

                <button
                  onClick={saveProfile}
                  className="
                    bg-black text-white
                    px-3 py-1.5 rounded-xl text-sm
                  "
                >
                  Save
                </button>

                <button
                  onClick={() => setEdit(false)}
                  className="text-sm text-gray-500"
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
