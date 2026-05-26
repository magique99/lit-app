"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";
import type { Profile } from "@/lib/types";

export default function ProfileTabsV4({
  postsSlot,
  profile,
  loading,
  error,
  userEmail,
}: {
  postsSlot: React.ReactNode;
  profile: Profile;
  loading: boolean;
  error: string | null;
  userEmail?: string | null;
}) {
  const [tab, setTab] = useState<
    "about" | "posts" | "settings"
  >("about");

  return (
    <div className="w-full">

      {/* TAB NAV — minimal border-bottom line */}
      <div
        className="
          flex gap-10
          border-b border-slate-200/70
          mb-10
        "
      >
        <TabButton
          active={tab === "about"}
          onClick={() => setTab("about")}
        >
          About
        </TabButton>
        <TabButton
          active={tab === "posts"}
          onClick={() => setTab("posts")}
        >
          Texte
        </TabButton>
        <TabButton
          active={tab === "settings"}
          onClick={() => setTab("settings")}
        >
          Setări
        </TabButton>
      </div>

      {/* CONTENT */}
      {tab === "about" && (
        <div className="space-y-8">
{loading ? (
             <div className="flex justify-center py-8"><Spinner /></div>
           ) : error ? (
            <div className="text-sm text-rose-500">{error}</div>
          ) : profile ? (
            <AboutContent profile={profile} />
          ) : (
            <div className="text-sm text-slate-400">Niciun profil configurat.</div>
          )}
        </div>
      )}

      {tab === "posts" && postsSlot}

      {tab === "settings" && (
        <div className="space-y-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
            Setările contului
          </p>
          <div className="space-y-6">
            {/* username */}
            <div>
              <label className="block text-[12px] uppercase tracking-[0.2em] text-slate-400 mb-2">
                Nume utilizator
              </label>
              <p className="text-[15px] font-medium text-slate-700">
                @{profile.username || "—"}
              </p>
            </div>
            {/* email */}
            <div>
              <label className="block text-[12px] uppercase tracking-[0.2em] text-slate-400 mb-2">
                Email
              </label>
              <p className="text-[15px] text-slate-500">
                {userEmail || "—"}
              </p>
            </div>
            {/* password change link */}
            <div className="pt-4">
              <button
                onClick={() => alert("Reset password — needs implementation")}
                className="
                  text-[14px] font-medium
                  border-b border-slate-300 pb-0.5
                  text-slate-600 hover:text-slate-900
                  transition-colors
                "
              >
                Schimbă parola
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ── TAB BUTTON ── */

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        pb-3 text-[13px] tracking-wide transition-colors duration-150
        ${active
          ? "text-slate-900 font-medium border-b-2 border-[#B87D4B]"
          : "text-slate-400 hover:text-slate-600"
        }
      `}
    >
      {children}
    </button>
  );
}

/* ── ABOUT CONTENT ── */

function AboutContent({ profile }: { profile: Profile }) {
  const fmtDate = (s: string | null) =>
    !s ? "—" : new Date(s).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-10">

      {/* STATISTICS */}
      <div className="grid grid-cols-3 gap-8">
        {[
          ["Texte",      profile.posts_count ?? 0],
          ["Urmaritori", profile.followers_count ?? 0],
          ["Urmariti",   profile.following_count ?? 0],
          ["Aprecieri",   profile.likes_count ?? 0],
          ["Comentarii",  profile.comments_count ?? 0],
        ].map(([label, value]) => (
          <div key={label as string} className="text-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-1.5">
              {label}
            </p>
            <p className="font-serif text-2xl font-medium tabular-nums" style={{ color: "#2A2520" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="h-px bg-slate-200/70" />

      {/* BI0 */}
      {profile.bio && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-2">
            Despre
          </p>
          <p
            className="text-[15px] leading-[1.8] text-slate-500"
            style={{ whiteSpace: "pre-line" }}
          >
            {profile.bio}
          </p>
        </div>
      )}

      <div className="h-px bg-slate-200/70" />

      {/* ADDITIONAL DETAILS */}
      <div className="space-y-4 text-[14px]">
        <Detail // Location
          icon="📍"
          label="Locatie"
          value={profile.city && profile.country
            ? `${profile.city}, ${profile.country}`
            : profile.city || profile.country || "Nespecificat"
          }
        />
        <Detail // Joined
          icon="📅"
          label="Inregistrat"
          value={fmtDate(profile.created_at)}
        />
        <Detail // Gender
          icon="○"
          label="Gen"
          value={profile.gender
            ? (profile.gender === "masculin" ? "Masculin"
              : profile.gender === "feminin" ? "Feminin"
              : profile.gender)
            : "Nespecificat"
          }
        />
        {profile.age && (
          <Detail
            icon="🎂"
            label="Varsta"
            value={`${profile.age} ani`}
          />
        )}
        {profile.phone && (
          <Detail
            icon="⊡"
            label="Telefon"
            value={profile.phone}
          />
        )}
        {profile.vehicle && (
          <Detail
            icon="◈"
            label="Moto"
            value={profile.vehicle}
          />
        )}
        {profile.awards && (
          <Detail
            icon="✦"
            label="Premii"
            value={profile.awards}
          />
        )}
      </div>

    </div>
  );
}

/* ── DETAIL ROW ── */

function Detail({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[13px] w-5 text-center text-slate-400">{icon}</span>
      <span className="text-[11px] uppercase tracking-[0.15em] text-slate-400 w-28 shrink-0">{label}</span>
      <span className="text-slate-600">{value}</span>
    </div>
  );
}
