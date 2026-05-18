"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import NotificationsDropdown from "./NotificationsDropdown";
import { useSearch } from "@/hooks/useSearch";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

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

        setProfile(profileData);
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
        backdrop-blur-xl
        bg-white/40
        border-b border-white/30
      "
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4">

        {/* LEFT */}
        <Link
          href="/"
          className="font-bold text-lg flex items-center gap-2"
        >
          📚 Lit App
        </Link>

        {/* CENTER NAV */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">

          {user && (
            <>
              <NavItem href="/create" label="✍️ Write" />
              <NavItem href="/profile" label="👤 Profile" />
            </>
          )}

          {/* SEARCH */}
          <div className="relative w-64">

            <input
              value={query}
              placeholder="Search posts or users..."
              className="w-full px-3 py-1 rounded-lg border bg-white/60 text-sm"
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                search(value);
              }}
            />

            {/* RESULTS */}
            {query.length > 0 && results.length > 0 && (
              <div className="absolute top-10 left-0 w-full bg-white border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">

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
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          {user ? (
            <>
              <NotificationsDropdown />

              <UserMenu
                profile={profile}
              />
            </>
          ) : (
            <div className="flex gap-3 text-sm">

              <Link
                href="/login"
                className="hover:underline"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="
                  bg-black text-white
                  px-4 py-2 rounded-lg
                "
              >
                Sign up
              </Link>

            </div>
          )}

          {/* MOBILE */}
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

          {user ? (
            <>
              <Link href="/create">
                ✍️ Write
              </Link>

              <Link href="/profile">
                👤 Profile
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                Login
              </Link>

              <Link href="/signup">
                Sign up
              </Link>
            </>
          )}

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
NAV ITEM
========================= */

function NavItem({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
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
USER MENU
========================= */

function UserMenu({
  profile,
}: {
  profile: any;
}) {
  const [open, setOpen] = useState(false);

  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">

      {/* AVATAR */}
      <button
        onClick={() => setOpen(!open)}
        className="
          w-9 h-9 rounded-full
          overflow-hidden bg-gray-300
        "
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </button>

      {/* MENU */}
      {open && (
        <div
          className="
            absolute right-0 mt-2 w-48
            bg-white border rounded-xl
            shadow-md text-sm overflow-hidden
          "
        >

          <Link
            href="/profile"
            className="block px-4 py-3 hover:bg-gray-50"
          >
            👤 Profile
          </Link>

          <Link
            href="/settings"
            className="block px-4 py-3 hover:bg-gray-50"
          >
            ⚙️ Settings
          </Link>

          <button
            onClick={logout}
            className="
              w-full text-left
              px-4 py-3 hover:bg-gray-50
            "
          >
            🚪 Logout
          </button>

        </div>
      )}
    </div>
  );
}