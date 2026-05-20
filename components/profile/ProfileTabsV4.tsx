"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ProfileTabsV4({
  postsSlot,
  profile,
  loading,
  error,
}: {
  postsSlot: React.ReactNode;
  profile: any; // Using any temporarily until we fix the type
  loading: boolean;
  error: string | null;
}) {
  const [tab, setTab] = useState<
    "about" | "posts" | "settings"
  >("posts");

  return (
    <div className="w-full">

      {/* TAB NAV */}
      <div
        className="
          flex
          justify-around
          sm:justify-start
          gap-6
          border-b
          border-gray-100
          mb-4
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
          Posts
        </TabButton>

        <TabButton
          active={tab === "settings"}
          onClick={() => setTab("settings")}
        >
          Settings
        </TabButton>

      </div>

      {/* CONTENT */}
      <div>

        {tab === "about" && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-sm text-gray-600 px-1">
                Loading profile...
              </div>
            ) : error ? (
              <div className="text-sm text-red-600 px-1">
                {error}
              </div>
            ) : profile ? (
              <AboutContent profile={profile} />
            ) : (
              <div className="text-sm text-gray-600 px-1">
                No profile data available
              </div>
            )}
          </div>
        )}

        {tab === "posts" && postsSlot}

        {tab === "settings" && (
          <div className="text-sm text-gray-600 px-1">
            Settings coming soon
          </div>
        )}

      </div>

    </div>
  );
}

/* =========================
    TAB BUTTON (Instagram-like)
======================= */

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
        relative
        pb-3
        text-sm
        transition
        ${
          active
            ? "text-black font-medium"
            : "text-gray-500 hover:text-black"
        }
      `}
    >
      {children}

      {/* ACTIVE INDICATOR */}
      <span
        className={`
          absolute left-0 bottom-0
          h-[2px] w-full
          transition
          ${
            active
              ? "bg-black"
              : "bg-transparent"
          }
        `}
      />
    </button>
  );
}

/* =========================
    ABOUT CONTENT
======================= */

function AboutContent({ profile }: { profile: any }) {
  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      {/* PROFILE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        {/* AVATAR */}
        <div className="flex-shrink-0">
          <Image
            src={profile.avatar_url ?? "/user.jpg"}
            alt={profile.username ?? "User avatar"}
            width={120}
            height={120}
            className="rounded-full border-4 border-white bg-gray-200 object-cover"
          />
        </div>

        {/* INFO */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-gray-900">
              {profile.username}
            </h2>
            {profile.verified && (
              <span className="text-blue-600">✓ Verified</span>
            )}
          </div>

          {/* NAME INFO */}
          <div className="text-sm text-gray-600 space-y-1">
            {profile.first_name && profile.last_name && (
              <>
                {profile.first_name} {profile.last_name}
                {profile.nickname && (
                  <span className="text-xs text-gray-500 ml-1">
                    ("{profile.nickname}")
                  </span>
                )}
              </>
            )}
            {!profile.first_name && !profile.last_name && profile.nickname && (
              <span className="text-xs text-gray-500">
                "{profile.nickname}"
              </span>
            )}
            
            {profile.gender && (
              <span className="text-xs text-gray-500">
                {profile.gender === 'masculin' ? 'Masculin' : 
                 profile.gender === 'feminin' ? 'Feminin' : 'Altul'}
              </span>
            )}
            
            {profile.age && (
              <span className="text-xs text-gray-500">
                {profile.age} ani
              </span>
            )}
            
            {profile.city && profile.country && (
              <span className="text-xs text-gray-500">
                {profile.city}, {profile.country}
              </span>
            )}
            
            {!profile.city && profile.country && (
              <span className="text-xs text-gray-500">
                {profile.country}
              </span>
            )}
            
            {profile.city && !profile.country && (
              <span className="text-xs text-gray-500">
                {profile.city}
              </span>
            )}
            
            {profile.phone && (
              <span className="text-xs text-gray-500">
                {profile.phone}
              </span>
            )}
            
            {profile.vehicle && (
              <span className="text-xs text-gray-500">
                {profile.vehicle}
              </span>
            )}
            
            {profile.awards && (
              <span className="text-xs text-gray-500 block">
                Premii: {profile.awards}
              </span>
            )}
            
            {profile.bio && (
              <p className="mt-1">
                {profile.bio}
              </p>
            )}
            
            {!profile.first_name && !profile.last_name && !profile.nickname && 
             !profile.gender && !profile.age && !profile.city && !profile.country && 
             !profile.phone && !profile.vehicle && !profile.awards && !profile.bio && (
               <span className="text-xs text-gray-500">
                 No profile information yet
               </span>
             )}
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm text-gray-500">
            <div>
              <p className="font-medium">{profile.posts_count ?? 0}</p>
              <p>Posts</p>
            </div>
            <div>
              <p className="font-medium">{profile.followers_count ?? 0}</p>
              <p>Followers</p>
            </div>
            <div>
              <p className="font-medium">{profile.following_count ?? 0}</p>
              <p>Following</p>
            </div>
          </div>
        </div>
      </div>

      {/* ADDITIONAL INFO */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">Mai multe detalii</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
              📍
            </span>
            <span>
              {profile.city && profile.country ? (
                <>
                  {profile.city}, {profile.country}
                </>
              ) : !profile.city && profile.country ? (
                <span>{profile.country}</span>
              ) : profile.city && !profile.country ? (
                <span>{profile.city}</span>
              ) : (
                <span className="text-gray-400">Not specified</span>
              )}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
              📞
            </span>
            <span>
              {profile.phone || <span className="text-gray-400">Not specified</span>}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
              🏍️
            </span>
            <span>
              {profile.vehicle || <span className="text-gray-400">Not specified</span>}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
              🏆
            </span>
            <span>
              {profile.awards || <span className="text-gray-400">Not specified</span>}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
              🎂
            </span>
            <span>
              {profile.age ? (
                <>
                  {profile.age} ani
                  {profile.gender && (
                    <span className="ml-1 text-xs text-gray-500">
                      ({profile.gender === 'masculin' ? 'M' : 
                       profile.gender === 'feminin' ? 'F' : 'O'})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-400">Not specified</span>
              )}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
              📅
            </span>
            <span>
              {profile.created_at ? (
                <span>{formatDate(profile.created_at)}</span>
              ) : (
                <span className="text-gray-400">Not specified</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
    TAB BUTTON (Instagram-like)
======================= */

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
        relative
        pb-3
        text-sm
        transition
        ${
          active
            ? "text-black font-medium"
            : "text-gray-500 hover:text-black"
        }
      `}
    >
      {children}

      {/* ACTIVE INDICATOR */}
      <span
        className={`
          absolute left-0 bottom-0
          h-[2px] w-full
          transition
          ${
            active
              ? "bg-black"
              : "bg-transparent"
          }
        `}
      />
    </button>
  );
}

/* =========================
   TAB BUTTON (Instagram-like)
========================= */

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
        relative
        pb-3
        text-sm
        transition
        ${
          active
            ? "text-black font-medium"
            : "text-gray-500 hover:text-black"
        }
      `}
    >

      {children}

      {/* ACTIVE INDICATOR */}
      <span
        className={`
          absolute left-0 bottom-0
          h-[2px] w-full
          transition
          ${
            active
              ? "bg-black"
              : "bg-transparent"
          }
        `}
      />
    </button>
  );
}