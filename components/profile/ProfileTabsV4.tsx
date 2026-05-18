"use client";

import { useState } from "react";

export default function ProfileTabsV4({
  postsSlot,
}: {
  postsSlot: React.ReactNode;
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
          <div className="text-sm text-gray-600 px-1">
            Profil personal — bio + info viitoare
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