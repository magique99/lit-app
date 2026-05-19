"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import NotificationsDropdown from "./NotificationsDropdown";
import { useSearch } from "@/hooks/useSearch";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const { results, search } = useSearch();

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      setUser(data.user ?? null);

      if (data.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", data.user.id)
          .maybeSingle();

        setProfile((profileData as Profile | null) ?? null);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header
      className="
        sticky top-0 z-50
        bg-white/80 backdrop-blur-md
        border-b border-gray-100
      "
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">

        {/* LOGO */}
        <Link
          href="/"
          className="font-bold text-lg"
        >
          📚 Lit App
        </Link>

        {/* SEARCH (desktop only Instagram-like) */}
        <div className="hidden md:block relative w-[320px]">

          <input
            value={query}
            placeholder="Search"
            className="
              w-full px-3 py-2
              rounded-xl
              border border-gray-200
              bg-gray-50 text-sm
            "
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              search(value);
            }}
          />

          {query.length > 0 && results.length > 0 && (
            <div className="
              absolute top-12 left-0 w-full
              bg-white border border-gray-100
              rounded-xl shadow-lg
              max-h-72 overflow-y-auto
            ">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="p-2 hover:bg-gray-50 text-sm"
                >
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

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          {user ? (
            <>
              <NotificationsDropdown userId={user.id} />

              <UserMenu profile={profile} />
            </>
          ) : (
            <div className="flex gap-3 text-sm">
              <Link href="/login">Login</Link>

              <Link
                href="/signup"
                className="
                  bg-black text-white
                  px-3 py-1.5 rounded-xl
                  text-sm
                "
              >
                Sign up
              </Link>
            </div>
          )}

          {/* MOBILE MENU BTN */}
          <button
            className="md:hidden text-xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>

        </div>
      </div>

      {/* MOBILE MENU (Instagram-like panel) */}
      {menuOpen && (
        <div className="
          md:hidden
          px-4 pb-4 pt-2
          flex flex-col gap-3
          border-t border-gray-100
          bg-white
        ">

          <input
            placeholder="Search"
            className="
              px-3 py-2
              rounded-xl
              border bg-gray-50
              text-sm
            "
          />

          <Link href="/create">✍️ Write</Link>
          <Link href="/profile">👤 Profile</Link>

          {!user && (
            <>
              <Link href="/login">Login</Link>
              <Link href="/signup">Sign up</Link>
            </>
          )}

        </div>
      )}
    </header>
  );
}

/* =========================
USER MENU (clean Instagram style)
========================= */

function UserMenu({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="relative">

      <button
        onClick={() => setOpen(!open)}
        className="
          w-9 h-9 rounded-full
          overflow-hidden
          bg-gray-200
          border border-gray-100
        "
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.username || "Avatar"}
            className="w-full h-full object-cover"
          />
        ) : null}
      </button>

      {open && (
        <div className="
          absolute right-0 mt-2 w-44
          bg-white border border-gray-100
          rounded-xl shadow-lg
          text-sm overflow-hidden
        ">

          <Link className="block px-4 py-3 hover:bg-gray-50" href="/profile">
            👤 Profile
          </Link>

          <Link className="block px-4 py-3 hover:bg-gray-50" href="/settings">
            ⚙️ Settings
          </Link>

          <button
            onClick={logout}
            className="
              w-full text-left px-4 py-3
              hover:bg-gray-50
            "
          >
            🚪 Logout
          </button>

        </div>
      )}
    </div>
  );
}
