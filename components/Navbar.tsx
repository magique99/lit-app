"use client";

import { useState } from "react";
import Link from "next/link";
import NotificationsDropdown from "./NotificationsDropdown";
import { useSearch } from "@/hooks/useSearch";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { results, search } = useSearch();

  return (
    <header
      className="
        sticky top-0 z-50
        backdrop-blur-xl
        bg-white/40
        border-b border-white/30
      "
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between p-4">

        {/* LEFT - BRAND */}
        <Link
          href="/"
          className="font-bold text-lg flex items-center gap-2"
        >
          📚 Lit App
        </Link>

        {/* CENTER - DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">

          <NavItem href="/create" label="✍️ Write" />
          <NavItem href="/profile" label="👤 Profile" />

          {/* SEARCH */}
          <div className="relative w-64">
            <input
            value={query}
            placeholder="Search posts or users..."
            className="w-full px-3 py-1 rounded-lg border bg-white/60 text-sm"
            onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                search(value); // ok acum
            }}
            />

            {/* DROPDOWN */}
            {query.length > 0 && results.length > 0 && (
              <div className="absolute top-10 left-0 w-full bg-white border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">

                {results.map((r) => (
                  <div key={r.id} className="p-2 hover:bg-gray-50 text-sm">

                    {r.type === "post" && (
                      <Link href={`/post/${r.id}`}>
                        📄 {r.title}
                      </Link>
                    )}

                    {r.type === "user" && (
                      <Link href={`/profile/${r.id}`}>
                        👤 {r.username}
                      </Link>
                    )}

                  </div>
                ))}

              </div>
            )}
          </div>

        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-4">

          <NotificationsDropdown />

          <UserMenu />

          {/* MOBILE BUTTON */}
          <button
            className="md:hidden text-xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>

        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3 text-sm">

          <Link href="/create">✍️ Write</Link>
          <Link href="/profile">👤 Profile</Link>

          <input
            placeholder="Search..."
            className="px-3 py-1 rounded-lg border bg-white/60"
          />

        </div>
      )}
    </header>
  );
}

/* =========================
   MEDIUM STYLE NAV ITEM
========================= */
function NavItem({ href, label }: any) {
  return (
    <Link href={href} className="relative group">
      {label}

      <span
        className="
          absolute left-0 -bottom-1 h-[2px] w-0
          bg-black transition-all group-hover:w-full
        "
      />
    </Link>
  );
}

/* =========================
   USER MENU DROPDOWN
========================= */
function UserMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">

      {/* AVATAR */}
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-gray-300"
      />

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-md text-sm">

          <Link href="/profile" className="block px-3 py-2 hover:bg-gray-50">
            Profile
          </Link>

          <Link href="/settings" className="block px-3 py-2 hover:bg-gray-50">
            Settings
          </Link>

          <button className="w-full text-left px-3 py-2 hover:bg-gray-50">
            Logout
          </button>

        </div>
      )}

    </div>
  );
}