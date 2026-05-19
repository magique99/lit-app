"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 bg-[#2a241f] text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="space-y-12">
          <div className="text-center">
            <Link href="/" className="font-serif text-2xl tracking-[0.3em] text-amber-200 transition hover:text-amber-100">
              Literatura9
            </Link>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm">
            <Link href="/" className="text-slate-400 transition hover:text-amber-200">
              Acasă
            </Link>
            <Link href="/create" className="text-slate-400 transition hover:text-amber-200">
              Adaugă text
            </Link>
            <Link href="/profile" className="text-slate-400 transition hover:text-amber-200">
              Profil
            </Link>
            <Link href="/login" className="text-slate-400 transition hover:text-amber-200">
              Login
            </Link>
          </nav>

          <div className="border-t border-[#3a342f]"></div>

          <p className="text-center font-serif text-xs tracking-[0.2em] text-slate-500 uppercase">
            Un proiect de literatură digitală
          </p>
        </div>
      </div>
    </footer>
  );
}