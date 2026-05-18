"use client";

import { useState } from "react";

export default function ProfileTabsV4({
  postsSlot,
}: {
  postsSlot: React.ReactNode;
}) {
  const [tab, setTab] = useState("posts");

  return (
    <div>

      {/* TAB NAV */}
      <div className="flex gap-4 border-b mb-4">

        <button onClick={() => setTab("about")}>
          About
        </button>

        <button onClick={() => setTab("posts")}>
          Posts
        </button>

        <button onClick={() => setTab("settings")}>
          Settings
        </button>

      </div>

      {/* TAB CONTENT */}
      <div>

        {tab === "about" && (
          <div className="text-sm text-gray-600">
            Profil personal — bio + info viitoare
          </div>
        )}

        {tab === "posts" && postsSlot}

        {tab === "settings" && (
          <div className="text-sm text-gray-600">
            Settings coming soon
          </div>
        )}

      </div>

    </div>
  );
}