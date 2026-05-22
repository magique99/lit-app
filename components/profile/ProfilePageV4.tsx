"use client";

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
        setError("A apărut o eroare la încărcarea profilului.");
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        Încărcare…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        <p>{error || "Acest utilizator nu are un profil configurat."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── SECTION HEADER ── */}
      <h2
        className="font-serif text-[28px] sm:text-[32px] leading-tight"
        style={{ color: "#2A2520" }}
      >
        @{profile.username}
      </h2>

      {/* ── STATE TAGS ── */}
      <div className="flex flex-wrap items-center gap-4 text-[13px]">
        {profile.bio && (
          <span className="text-slate-500">{profile.bio}</span>
        )}
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">
          {profile.city && profile.country
            ? `${profile.city}, ${profile.country}`
            : profile.city || profile.country || "Locatie necunoscuta"}
        </span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">
          Inregistrat {profile.created_at
            ? new Date(profile.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })
            : "—"}
        </span>
      </div>

      {/* ── SEPARATOR ── */}
      <div className="h-px bg-slate-200/70" />

      {/* ── TABS + CONTENT ── */}
      <ProfileTabsV4
        postsSlot={<ProfilePostsV2 />}
        profile={profile}
        loading={loading}
        error={error}
      />
    </div>
  );
}
