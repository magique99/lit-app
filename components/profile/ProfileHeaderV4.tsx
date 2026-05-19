"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";
import { toProfile } from "@/lib/types";

export default function ProfileHeaderV4() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [edit, setEdit] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("LOAD PROFILE ERROR:", error);
          setLoadError("Nu am putut încărca profilul.");
          return;
        }

        setProfile(toProfile(data));
      });
  }, [userId]);

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        {loadError}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-32 bg-gray-100 animate-pulse rounded-xl" />
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">

      {/* COVER (Instagram-like small banner) */}
      <div className="h-20 sm:h-24 bg-gradient-to-r from-gray-900 to-gray-600" />

      {/* CONTENT */}
      <div className="px-4 sm:px-6 pb-5">

        {/* AVATAR + INFO */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">

          {/* AVATAR */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shrink-0">
            <Image
              src={profile.avatar_url ?? "/user.jpg"}
              alt={profile.username || "Avatar"}
              fill
              sizes="(min-width: 640px) 96px, 80px"
              className="object-cover"
            />
          </div>

          {/* INFO */}
          <div className="flex-1 text-center sm:text-left">

            {!edit ? (
              <>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {profile.username}
                </h2>

                <p className="text-sm text-gray-600 mt-1">
                  {profile.bio || "No bio yet"}
                </p>

                <button
                  onClick={() => setEdit(true)}
                  className="
                    mt-3 sm:mt-4
                    w-full sm:w-auto
                    px-4 py-2
                    rounded-xl border
                    text-sm
                    hover:bg-gray-50
                    transition
                  "
                >
                  Edit profile
                </button>
              </>
            ) : (
              <ProfileEditorInline
                profile={profile}
                onClose={() => setEdit(false)}
                onSaved={setProfile}
              />
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

function ProfileEditorInline({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: (profile: Profile) => void;
}) {
  const [username, setUsername] =
    useState(profile.username || "");

  const [bio, setBio] =
    useState(profile.bio || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!profile.id) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        bio,
      })
      .eq("id", profile.id);

    if (error) {
      console.error("SAVE PROFILE ERROR:", error);
      setError("Nu am putut salva profilul.");
      setSaving(false);
      return;
    }

    onSaved({
      ...profile,
      username,
      bio,
    });

    setSaved(true);
    setSaving(false);
    onClose();
  }

  return (
    <div className="space-y-3 mt-4">

      <input
        value={username}
        onChange={(e) =>
          setUsername(e.target.value)
        }
        className="
          w-full border rounded-xl p-3 text-sm
        "
        placeholder="username"
      />

      <textarea
        value={bio}
        onChange={(e) =>
          setBio(e.target.value)
        }
        className="
          w-full border rounded-xl p-3 text-sm
        "
        placeholder="bio"
      />

      <div className="flex flex-col sm:flex-row gap-2">

        <button
          onClick={() => void save()}
          disabled={saving}
          className="
            bg-black text-white
            px-4 py-2 rounded-xl
            text-sm
            disabled:cursor-wait
            disabled:opacity-60
          "
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          onClick={onClose}
          disabled={saving}
          className="
            text-gray-500 text-sm
            disabled:cursor-wait
            disabled:opacity-60
          "
        >
          Cancel
        </button>

      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {saved && (
        <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved
        </div>
      )}
    </div>
  );
}
