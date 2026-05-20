"use client";

import ProfileHeaderV4 from "@/components/profile/ProfileHeaderV4";
import ProfileTabsV4 from "@/components/profile/ProfileTabsV4";
import ProfilePostsV2 from "@/components/profile/ProfilePostsV2";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toProfile } from "@/lib/types";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;

        if (!uid) {
          setLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", uid)
          .single();

        if (profileError && !profileError?.message?.includes("No rows")) {
          console.error("LOAD PROFILE ERROR:", profileError);
          setError("Nu am putut încărca informațiile de profil.");
          setLoading(false);
          return;
        }

        setProfile(profileData ? toProfile(profileData) : null);
        setLoading(false);
      } catch (err) {
        console.error("LOAD PROFILE ERROR:", err);
        setError("Nu am putut încărca informațiile de profil.");
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  return (
    <main className="max-w-screen-2xl mx-auto p-6 space-y-6">
      <ProfileHeaderV4 />
      
      <ProfileTabsV4
        postsSlot={<ProfilePostsV2 />}
        profile={profile}
        loading={loading}
        error={error}
      />
    </main>
  );
}