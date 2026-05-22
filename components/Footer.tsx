"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-24 py-16 px-6 bg-[#2a241f]" style={{background: "#2a241f"}}>
      <div className="max-w-6xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="font-serif text-3xl tracking-[0.3em] text-[#e8d5c0] transition hover:text-[#d4c0a8] inline-flex items-center gap-3"
          >
            <Image
              src="/Literatura9.png"
              alt=""
              width={36}
              height={36}
              className="rounded-full object-cover opacity-80"
            />
            Literatura<span style={{ color: "#c4956a" }}>9</span>
          </Link>
          <p className="mt-4 text-xs text-slate-500 font-serif tracking-[0.2em] uppercase">
            Un proiect de literatură digitală
          </p>
          <p className="mt-1 text-xs text-slate-600 font-serif">
            © {new Date().getFullYear()} Literatura9
          </p>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm">
          <Link
            href="/texte"
            className="text-slate-400 transition hover:text-[#c4956a]"
          >
            Texte
          </Link>
          <Link
            href="/"
            className="text-slate-400 transition hover:text-[#c4956a]"
          >
            Pagina principală
          </Link>
          <Link
            href="/create"
            className="text-slate-400 transition hover:text-[#c4956a]"
          >
            Adaugă text
          </Link>
          <Link
            href="/profile"
            className="text-slate-400 transition hover:text-[#c4956a]"
          >
            Profil
          </Link>
          <Link
            href="/about"
            className="text-slate-400 transition hover:text-[#c4956a]"
          >
            Despre
          </Link>
          <Link
            href="/contact"
            className="text-slate-400 transition hover:text-[#c4956a]"
          >
            Contact
          </Link>
        </nav>

        <div className="mt-10 border-t border-[#3a342f]"></div>

        <p className="mt-6 text-center text-[11px] text-slate-600 font-serif tracking-[0.15em] leading-relaxed">
          &ldquo;Puține semne, fiecare ales cu răbdarea cu care se deschide o rană sau un vis.&rdquo;
        </p>
      </div>
    </footer>
  );
}
