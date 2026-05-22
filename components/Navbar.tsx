"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

// Color theme (copied from app/page.tsx)
const C = {
  bg:           "#F7F3EE",   // cream, cald
  surface:      "#FFFCF7",   // alb-crem pentru carduri
  text:         "#2A2520",   // cafenie închis, nu negru pur
  muted:        "#7A7268",   // cafenie moderată
  accent:       "#B87D4B",   // teracotă / aramiu — singurul accent
  accentHover:  "#9E6538",
  border:       "#E8E0D8",   // linii foarte discrete
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let ignore = false;
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!ignore) {
        setUser(data.user ?? null);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header
      className="sticky top-0 z-50 bg-[#fffaf3]/95 backdrop-blur-xl shadow-sm border-b border-slate-200/70"
    >
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        {/* LOGO */}
        <Link href="/"
              className="font-serif text-lg tracking-[0.35em] text-slate-900 transition hover:text-slate-950"
        >
          Literatura9
        </Link>

        {/* RIGHT: TWO BUTTONS */}
        <div className="flex items-center gap-3">
          {/* Butonul Texte */}
          <Link href="/texte"
                className="rounded-full px-7 py-3.5 text-sm font-medium transition-all duration-300 active:scale-[0.97]"
                style={{
                  color: C.text,
                  border: `1.5px solid ${C.text}`,
                }}
          >
            Texte
          </Link>

          {/* Butonul Conectare */}
          {user ? (
            <Link href="/create"
                  className="rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_8px_30px_rgba(184,125,75,0.3)] active:scale-[0.97]"
                  style={{ backgroundColor: C.accent }}
            >
              Conectare
            </Link>
          ) : (
            <Link href="/login"
                  className="rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_8px_30px_rgba(184,125,75,0.3)] active:scale-[0.97]"
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