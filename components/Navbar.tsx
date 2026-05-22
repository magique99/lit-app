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
import { toProfile } from "@/lib/types";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const { results, search } = useSearch();

  useEffect(() => {
    let ignore = false;
    const profileChannel: any = null;
    
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      setUser(data.user ?? null);

      if (data.user && !ignore) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (!ignore) {
          setProfile(toProfile(profileData));
        }
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (!ignore) {
              setProfile(toProfile(data));
            }
          });
      } else {
        if (!ignore) {
          setProfile(null);
        }
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, []);

  // Listen for profile updates in real-time
  const currentUserId = user?.id;
  useEffect(() => {
    if (!currentUserId) return;

    const profileChannel = supabase
      .channel(`profile-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setProfile((prev) => ({
            ...prev,
            username: updated.username ?? prev?.username,
            avatar_url: updated.avatar_url ?? prev?.avatar_url,
          }) as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [currentUserId]);

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
      className="sticky top-0 z-50 bg-[#fffaf3]/95 backdrop-blur-xl shadow-sm border-b border-slate-200/70"
    >
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4">

        {/* LOGO */}
        <Link
          href="/"
          className="font-serif text-lg tracking-[0.35em] text-slate-900 transition hover:text-slate-950"
        >
          Literatura9
        </Link>

        <div className="hidden md:flex min-w-[320px] flex-1 items-center justify-center">
          <div className="relative w-full max-w-[420px]">
            <input
              value={query}
              placeholder="Caută articole sau autori"
              className="w-full rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm transition focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                setSearchOpen(value.length > 0);
                search(value);
              }}
            />

          {searchOpen && query.length > 0 && results.length > 0 && (
            <div className="absolute top-14 left-0 w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)] max-h-72 overflow-y-auto">
              {results.map((r) => (
                <Link
                  key={r.id}
                  href={r.type === "post" ? `/post/${r.id}` : `/profile/${r.id}`}
                  className="block px-4 py-3 text-sm text-slate-700 transition hover:bg-[#fbf4e6]"
                >
                  {r.type === "post" ? "📄" : "👤"} {r.type === "post" ? r.title : r.username}
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>

         {/* RIGHT */}
         <div className="flex items-center gap-3">
           <Link href="/about" className="hidden md:inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-[#fff4e5]">
             Despre
           </Link>
           <Link href="/contact" className="hidden md:inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-[#fff4e5] ml-4">
             Contact
           </Link>
           <button
             className="hidden md:inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-[#fff4e5]"
             onClick={() => {
               if (user) {
                 window.location.href = "/create";
               } else {
                 window.location.href = "/signup";
               }
             }}
           >
             {user ? "Adaugă text" : "Înregistrează-te"}
           </button>

             {user ? (
               <>
                 <Link href="/notifications" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-[#fff4e5]">
                   🔔 Notificări
                 </Link>
                 <Link href="/about" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-[#fff4e5]">
                   ℹ️ Despre
                 </Link>
                 <Link href="/contact" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-[#fff4e5]">
                   📞 Contact
                 </Link>
               </>
             ) : (
               <>
                 <Link href="/login" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-[#fff4e5]">
                   Login
                 </Link>
                 <Link href="/signup" className="block rounded-2xl border border-amber-300 bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
                   Sign up
                 </Link>
                 <Link href="/about" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-[#fff4e5]">
                   ℹ️ Despre
                 </Link>
                 <Link href="/contact" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-[#fff4e5]">
                   📞 Contact
                 </Link>
               </>
             )}

          {/* MOBILE MENU BTN */}
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-[#fbf4e6] md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* MOBILE MENU (Instagram-like panel) */}
      {menuOpen && (
        <div className="md:hidden rounded-b-[2rem] border-t border-slate-200/70 bg-[#fff7ed] px-4 pb-6 pt-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">

          <div className="mb-4">
            <input
              placeholder="Caută"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="space-y-3">
            <Link href="/create" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-[#fff4e5]">
              ✍️ Adaugă text
            </Link>
            <Link href="/profile" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-[#fff4e5]">
              👤 Profil
            </Link>

            {user ? (
              <Link href="/notifications" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-[#fff4e5]">
                🔔 Notificări
              </Link>
            ) : (
              <>
                <Link href="/login" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-[#fff4e5]">
                  Login
                </Link>
                <Link href="/signup" className="block rounded-2xl border border-amber-300 bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
                  Sign up
                </Link>
              </>
            )}
          </div>
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
        className="relative w-10 h-10 overflow-hidden rounded-full border border-slate-200 bg-[#f5ece1] transition hover:ring-2 hover:ring-slate-200/90 focus:outline-none focus:ring-amber-200"
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
