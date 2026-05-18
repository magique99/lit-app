"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileHeaderV4() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

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
      .then(({ data }) => setProfile(data));
  }, [userId]);

  if (!profile) {
    return (
      <div className="h-40 bg-gray-100 animate-pulse rounded-xl" />
    );
  }

  return (
    <div className="space-y-4">

      {/* COVER */}
      <div className="h-32 rounded-xl bg-gradient-to-r from-gray-900 to-gray-600" />

      {/* HEADER ROW */}
      <div className="flex items-end gap-4 -mt-10 px-4">

        {/* AVATAR */}
        <div className="w-20 h-20 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full font-bold">
              U
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="flex-1">
          <h2 className="text-xl font-bold">
            {profile.username}
          </h2>

          <p className="text-sm text-gray-600">
            {profile.bio || "No bio"}
          </p>
        </div>

        {/* STATS */}
        <div className="flex gap-4 text-sm text-gray-600">

          <div>
            <div className="font-bold">0</div>
            Posts
          </div>

          <div>
            <div className="font-bold">0</div>
            Likes
          </div>

          <div>
            <div className="font-bold">0</div>
            Comments
          </div>

        </div>

      </div>

    </div>
  );
}