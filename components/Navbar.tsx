"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const C = {
  bg: "#2a241f",
  surface: "#3a342f",
  text: "#e8d5c0",
  muted: "#a89a8d",
  border: "#3a342f",
  accent: "#c4956a",
  accentHover: "#d4c0a8",
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!ignore) setUser(data.user ?? null);
    };
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) {
        setUser(session?.user ?? null);
        setAvatarUrl(null);
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  // Load avatar from profile when user is available
  useEffect(() => {
    if (!user?.id) return;

    let ignore = false;

    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!ignore) setAvatarUrl(data?.avatar_url ?? null);
    };

    load();

    return () => { ignore = true; };
  }, [user]);

  // close on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

return (
    <header className="sticky top-0 z-50" style={{ background: C.bg }}>
         <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          {/* LOGO */}
          <Link
            href="/"
            className="font-serif text-lg tracking-[0.35em] transition"
            style={{ color: C.text }}
          >
            Literatura9
          </Link>

          {/* RIGHT */}
          <div className="flex items-center gap-3">

            {/* Texte */}
            <Link
              href="/texte"
              className="rounded-full px-7 py-3.5 text-sm font-medium transition-all duration-300 active:scale-[0.97]"
              style={{
                color: C.text,
                border: `1.5px solid ${C.border}`,
                background: C.surface,
              }}
            >
              Citeste Texte
            </Link>

            {user ? (
              /* ── PROFILUL CONECTAT ── */
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="
                    h-10 w-10 rounded-full overflow-hidden
                    border border-slate-500/80
                    focus:outline-none focus:ring-1 focus:ring-slate-400
                    active:scale-[0.97] transition
                  "
                >
{avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={user.email ?? "avatar"}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={`https://ui-avatars.com/api/?background=2a241f&color=e8d5c0&name=${encodeURI(
                        user.email?.split("@")[0] ?? "user"
                      )}`}
                      alt={user.email ?? "avatar"}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>

                {menuOpen && (
                  <div
                    className="
                      absolute right-0 top-full mt-2
                      w-48
                      bg-[#3a342f]/95 backdrop-blur-md
                      border border-slate-600/80
                      rounded-xl shadow-[0_12px_40px_rgba(15,23,42,0.10)]
                      py-2
                      z-50
                      animate-in fade-in slide-in-from-top-2 duration-150
                    "
                  >
                    {/* header: email */}
                    <p className="px-4 py-2 text-[11px] font-medium text-slate-400 truncate border-b border-slate-600">
                      {user.email}
                    </p>

                    <Link
                      href="/create"
                      onClick={() => setMenuOpen(false)}
                      className="
                        block px-4 py-2.5 text-sm text-slate-300
                        hover:bg-slate-700 hover:text-slate-100
                        transition-colors
                      "
                    >
                      Adauga Text
                    </Link>

                    <Link
                      href="/notifications"
                      onClick={() => setMenuOpen(false)}
                      className="
                        block px-4 py-2.5 text-sm text-slate-300
                        hover:bg-slate-700 hover:text-slate-100
                        transition-colors
                      "
                    >
                      Notificări
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="
                        block px-4 py-2.5 text-sm text-slate-300
                        hover:bg-slate-700 hover:text-slate-100
                        transition-colors
                      "
                    >
                      Setările contului
                    </Link>

                    <div className="my-1.5 border-t border-slate-600" />

                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await supabase.auth.signOut();
                        window.location.href = "/";
                      }}
                      className="
                        block w-full text-left px-4 py-2.5 text-sm text-rose-400/80
                        hover:bg-rose-900/20 hover:text-rose-300
                        transition-colors
                      "
                    >
                      Deconectare
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── CONECTARE ── */
              <Link
                href="/login"
                className="
                  rounded-full px-7 py-3.5 text-sm font-semibold text-white
                  transition-all duration-300
                  hover:shadow-[0_8px_30px_rgba(184,125,75,0.3)]
                  active:scale-[0.97]
                "
                style={{ backgroundColor: C.accent }}
              >
                Conectare
              </Link>
            )}

          </div>
        </div>
    </header>
  );
}
