"use client";

import { useEffect, useRef, useState } from "react";
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
  const [searchOpen, setSearchOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (
        (menuOpen || searchOpen) &&
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("touchstart", handleClickOutside);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen, searchOpen]);

  return (
    <header
      ref={rootRef}
      className="
        sticky top-0 z-50
        bg-[#fffaf3]/90 backdrop-blur-xl
        border-b border-slate-200/70
      "
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">

        {/* LOGO */}
        <Link
          href="/"
            className="font-serif text-sm uppercase tracking-[0.35em] text-slate-800 transition hover:text-slate-950"
        </Link>

        <div className="hidden md:block relative w-[300px]">

          <input
            value={query}
            placeholder="Caută articole sau autori"
            className="
              w-full px-3 py-2.5
              rounded-2xl
              border border-slate-200
              bg-white text-sm text-slate-700
              placeholder:text-slate-400
              shadow-sm
            "
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              setSearchOpen(value.length > 0);
              search(value);
            }}
          />

          {searchOpen && query.length > 0 && results.length > 0 && (
            <div className="
              absolute top-12 left-0 w-full
              bg-white border border-slate-200
              rounded-xl shadow-[0_20px_80px_rgba(15,23,42,0.08)]
              max-h-72 overflow-y-auto
            ">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="p-2 transition hover:bg-[#f8f4ee] text-sm text-slate-700"
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
            <div className="flex items-center gap-4 text-sm text-slate-700">
              <Link href="/login" className="transition hover:text-slate-950">
                Login
              </Link>

              <Link
                href="/signup"
                className="
                  rounded-full border border-amber-300 bg-amber-400 px-4 py-1.5
                  text-sm font-semibold text-slate-950 transition duration-200
                  hover:-translate-y-0.5 hover:bg-amber-300
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
          border-t border-slate-200/70
          bg-[#fcf5ec]
        ">

          <input
            placeholder="Caută"
            className="
                w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 shadow-sm
          <Link href="/create" className="block rounded-2xl px-3 py-3 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:bg-[#fff4e5]">
            ✍️ Write
          </Link>
          <Link href="/profile" className="block rounded-2xl px-3 py-3 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:bg-[#fff4e5]">
            👤 Profile
          </Link>

          {!user && (
            <>
              <Link href="/login" className="block rounded-2xl px-3 py-3 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:bg-[#fff4e5]">
                Login
              </Link>
              <Link href="/signup" className="block rounded-2xl border border-amber-300 bg-amber-400 px-3 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
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
  const menuRef = useRef<HTMLDivElement | null>(null);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    function handleClickAway(event: Event) {
      if (
        open &&
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickAway);
    window.addEventListener("touchstart", handleClickAway);

    return () => {
      window.removeEventListener("mousedown", handleClickAway);
      window.removeEventListener("touchstart", handleClickAway);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>

      <button
        onClick={() => setOpen(!open)}
        className="
          relative
          w-10 h-10 rounded-full
          overflow-hidden
          bg-[#f5ece1]
          border border-slate-200
          transition hover:ring-2 hover:ring-slate-200/90
        "
      >
        <Image
          src={profile?.avatar_url ?? "/user.jpg"}
          alt={profile?.username || "Avatar"}
          fill
          sizes="36px"
          className="object-cover"
        />
      </button>

      {open && (
        <div className="
          absolute right-0 mt-3 min-w-[11rem]
          rounded-3xl border border-slate-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)]
          text-sm overflow-hidden
        ">

          <Link className="block px-4 py-3 text-slate-700 transition hover:bg-[#f8f4ee]" href="/profile">
            Profile
          </Link>

          <Link className="block px-4 py-3 text-slate-700 transition hover:bg-[#f8f4ee]" href="/settings">
            Settings
          </Link>

          <button
            onClick={logout}
            className="w-full text-left px-4 py-3 text-slate-700 transition hover:bg-[#f8f4ee]"
          >
            Logout
          </button>

        </div>
      )}
    </div>
  );
}
