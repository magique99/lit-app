"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

        setProfile(profileData ?? null);
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
        absolute inset-x-0 top-0 z-50
        bg-white/20 backdrop-blur-2xl
        border-b border-white/60
      "
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">

        {/* LOGO */}
        <Link
          href="/"
          className="font-semibold text-sm uppercase tracking-[0.35em] text-slate-700"
        >
          lit
        </Link>

        <div className="hidden md:block relative w-[300px]">

          <input
            value={query}
            placeholder="Caută articole sau autori"
            className="
              w-full px-3 py-2.5
              rounded-2xl
              border border-gray-200/70
              bg-white/80 text-sm text-slate-700
              placeholder:text-slate-400
              shadow-sm
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
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/login" className="hover:text-slate-900">
                Login
              </Link>

              <Link
                href="/signup"
                className="
                  rounded-full border border-slate-200 bg-slate-950 px-4 py-1.5
                  text-sm text-white
                  transition hover:bg-slate-800
                "
              >
                Sign up
              </Link>
            </div>
          )}

          {/* MOBILE MENU BTN */}
          <button
            className="md:hidden text-xl text-slate-600"
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
          px-4 pb-4 pt-3
          space-y-3
          border-t border-gray-200/70
          bg-white
        ">

          <input
            placeholder="Caută"
            className="
              w-full px-3 py-2 rounded-2xl border border-gray-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 shadow-sm
            "
          />

          <Link href="/create" className="block rounded-2xl px-3 py-3 text-sm text-slate-700 hover:bg-slate-50">
            ✍️ Write
          </Link>
          <Link href="/profile" className="block rounded-2xl px-3 py-3 text-sm text-slate-700 hover:bg-slate-50">
            👤 Profile
          </Link>

          {!user && (
            <>
              <Link href="/login" className="block rounded-2xl px-3 py-3 text-sm text-slate-700 hover:bg-slate-50">
                Login
              </Link>
              <Link href="/signup" className="block rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 hover:bg-slate-50">
                Sign up
              </Link>
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
          relative
          w-10 h-10 rounded-full
          overflow-hidden
          bg-slate-100
          border border-slate-200
          transition hover:ring-2 hover:ring-slate-200
        "
      >
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.username || "Avatar"}
            fill
            sizes="36px"
            className="object-cover"
          />
        ) : null}
      </button>

      {open && (
        <div className="
          absolute right-0 mt-3 min-w-[11rem]
          rounded-3xl border border-slate-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)]
          text-sm overflow-hidden
        ">

          <Link className="block px-4 py-3 text-slate-700 hover:bg-slate-50" href="/profile">
            Profile
          </Link>

          <Link className="block px-4 py-3 text-slate-700 hover:bg-slate-50" href="/settings">
            Settings
          </Link>

          <button
            onClick={logout}
            className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>

        </div>
      )}
    </div>
  );
}
