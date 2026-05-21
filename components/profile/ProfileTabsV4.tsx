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
    <div className="space-y-8">
      {/* STATISTICS */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Statistici
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{profile.posts_count ?? 0}</p>
            <p className="text-sm text-gray-500">Posts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{profile.followers_count ?? 0}</p>
            <p className="text-sm text-gray-500">Followers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{profile.following_count ?? 0}</p>
            <p className="text-sm text-gray-500">Following</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{profile.likes_count ?? 0}</p>
            <p className="text-sm text-gray-500">Likes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{profile.comments_count ?? 0}</p>
            <p className="text-sm text-gray-500">Comments</p>
          </div>
        </div>
      </div>

      {/* ADDITIONAL INFO */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Mai multe detalii
        </h3>
        <div className="space-y-4 text-sm">
          <div className="flex items-center space-x-3">
            <span className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-600">
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
            <span className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-600">
              📞
            </span>
            <span>
              {profile.phone || <span className="text-gray-400">Not specified</span>}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-600">
              🏍️
            </span>
            <span>
              {profile.vehicle || <span className="text-gray-400">Not specified</span>}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-600">
              🏆
            </span>
            <span>
              {profile.awards || <span className="text-gray-400">Not specified</span>}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-600">
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
            <span className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-600">
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

