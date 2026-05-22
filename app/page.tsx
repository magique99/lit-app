"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { Post, Profile } from "@/lib/types";
import { htmlToPlainTextWithNewlines } from "@/lib/content";

/* =====================================================
   COLOANE
   ===================================================== */
const C = {
  bg:           "#F7F3EE",   // cream, cald
  surface:      "#FFFCF7",   // alb-crem pentru carduri
  text:         "#2A2520",   // cafenie închis, nu negru pur
  muted:        "#7A7268",   // cafenie moderată
  accent:       "#B87D4B",   // teracotă / aramiu — singurul accent
  accentHover:  "#9E6538",
  border:       "#E8E0D8",   // linii foarte discrete
};

/* =====================================================
   COMPONENTELE SECȚIUNILOR
   ===================================================== */

/* ---- HERO ---- */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Imagine de fundal */}
      <div className="absolute inset-0">
        <Image
          src="/Literatura9.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Overlay cald, stratificat */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2A2520]/70 via-[#2A2520]/45 to-[#F7F3EE]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2A2520]/30 via-transparent to-[#2A2520]/20" />
      </div>

      {/* Conținut */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Titlu înalt, cu literă L decorativă */}
        <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-medium tracking-tight text-white/95 leading-[0.85]">
          Literatura<span className="text-[#B87D4B]">9</span>
        </h1>

        {/* Tagline / brand statement */}
        <p className="mt-6 sm:mt-8 md:mt-10 text-base sm:text-lg md:text-xl font-light italic text-white/70 max-w-xl mx-auto leading-relaxed">
          &ldquo;Puține semne, fiecare ales cu răbdarea cu care se deschide o rană sau un vis.&rdquo;
        </p>

        {/* Sub-text explicativ scurt */}
        <p className="mt-5 text-sm sm:text-base text-white/50 max-w-md mx-auto leading-relaxed">
          O platformă pentru scriitorii care cred că fiecare cuvânt contează.
        </p>

        {/* CTA principal */}
        <div className="mt-10 sm:mt-12">
          <Link
            href="/create"
            className="inline-flex items-center gap-3 rounded-full bg-[#B87D4B] px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#9E6538] hover:shadow-[0_8px_30px_rgba(184,125,75,0.35)] active:scale-[0.97]"
          >
            <span>Scrie un text</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h6M8 5l3 3-3 3"/></svg>
          </Link>
        </div>
      </div>

      {/* Indicatori de scroll */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">Jos</span>
        <div className="h-8 w-px bg-gradient-to-b from-white/30 to-transparent" />
      </div>
    </section>
  );
}

/* ---- MANIFEST / DESPRE ---- */
function Manifest() {
  return (
    <section className="py-28 sm:py-36 md:py-44 px-6" style={{ background: C.bg }}>
      <div className="max-w-2xl mx-auto text-center">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em]" style={{ color: C.accent }}>
          Despre Literatura9
        </span>

        <h2 className="mt-4 font-serif text-3xl sm:text-4xl md:text-5xl font-medium leading-tight" style={{ color: C.text }}>
          Literatura nu se grăbește.
        </h2>

        <div className="mt-8 sm:mt-10 space-y-5 text-sm sm:text-base leading-[1.9] sm:leading-[2]" style={{ color: C.muted }}>
          <p>
            Luna de aur apune. Cuvintele rămân. Între ele, o lume se construiește încet,
            fără grație, dar cu adevărat.
          </p>
          <p>
            Literatura9 este un spațiu pentru scriitorii care înțeleg că un bun text
            nu se scrie în 10 minute — ci se rafinează în zeci de citiri,
            în tăceri lungi, în recunoașterea greșelilor și în curajul de a le corecta.
          </p>
        </div>

        {/* Decoration line */}
        <div className="mx-auto mt-10 h-px w-16" style={{ background: C.accent }} />
      </div>
    </section>
  );
}

/* ---- FEATURES grid (3 coloane) ---- */
const FEATURES = [
  {
    title: "Scrie cu răbdare",
    body:  "Un editor curat, fără distrageri, unde fiecare paragraf primește timpul și atenția pe care îl merită.",
    link:  "/create",
    linkLabel: "Începe să scrii",
  },
  {
    title: "Citește cu înțelepciune",
    body:  "O comunitate de cititori care citesc cu ochii critici și inima deschisă, nu cu pixelii agitați.",
    link:  null, // va fi adăugat mai jos
    linkLabel: null,
  },
  {
    title: "Fă-te auzit",
    body:  "Publică pe termen lung. Învețe din reacțiile celorlalți. Crește cu fiecare răspuns.",
    link:  null,
    linkLabel: null,
  },
];

function Features() {
  return (
    <section className="py-28 sm:py-36 md:py-44 px-6" style={{ background: C.surface }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 sm:mb-20">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em]" style={{ color: C.accent }}>
            Cum funcționează
          </span>
          <h2 className="mt-4 font-serif text-3xl sm:text-4xl md:text-5xl font-medium" style={{ color: C.text }}>
            Trei motive să rămâi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="group rounded-3xl border p-8 sm:p-10 transition-all duration-500 hover:-translate-y-1"
              style={{
                background: C.bg,
                borderColor: C.border,
              }}
            >
              <div className="h-px w-8 mb-6" style={{ background: C.accent }} />

              <h3
                className="font-serif text-xl sm:text-2xl font-medium leading-snug"
                style={{ color: C.text }}
              >
                {f.title}
              </h3>

              <p
                className="mt-3 text-sm leading-[1.85]"
                style={{ color: C.muted }}
              >
                {f.body}
              </p>

              {f.link && (
                <Link
                  href={f.link}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium transition-colors duration-300"
                  style={{ color: C.accent }}
                >
                  {f.linkLabel}
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h8M7 4l3 3-3 3"/></svg>
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- CTA ---- */
function CTA() {
  return (
    <section className="py-28 sm:py-36 md:py-44 px-6" style={{ background: C.bg }}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium leading-tight" style={{ color: C.text }}>
          Primul cuvânt<br />începe astăzi.
        </h2>

        <p className="mt-6 text-sm sm:text-base leading-[1.9]" style={{ color: C.muted }}>
          Fie că scrii poezie, nuvele, eseuri sau doar gânduri care nu încap într-un tweet —
          Literatură9 este locul unde textele lor găsesc un spațiu propriu.
          Nu algoritmi. Nu jumătăți de atenție. Doar cuvintele tale și cititorii care le merită.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/create"
            className="rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_8px_30px_rgba(184,125,75,0.3)] active:scale-[0.97]"
            style={{ background: C.accent }}
          >
            Scrie un text
          </Link>
          <Link
            href="/texte"
            className="rounded-full px-7 py-3.5 text-sm font-medium transition-all duration-300 active:scale-[0.97]"
            style={{
              color: C.accent,
              border: `1.5px solid ${C.accent}`,
            }}
          >
            Texte
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =====================================================
    COMPONENTELE NOUĚ ADAUGATE
    ===================================================== */

function SocialProof() {
  return (
    <section className="py-20" style={{ background: C.surface }}>
      <div className="max-w-4xl mx-auto text-center px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: C.accent }}>
              Texte publicate
            </p>
            <p className="mt-2 font-serif text-3xl font-medium" style={{ color: C.text }}>
              124
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: C.accent }}>
              Autori activi
            </p>
            <p className="mt-2 font-serif text-3xl font-medium" style={{ color: C.text }}>
              37
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: C.accent }}>
              Platformă pentru literatură digitală
            </p>
            <p className="mt-2 font-serif text-2xl font-medium" style={{ color: C.text }}>
              Nouă și în creștere
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12" style={{ background: C.bg }}>
      <div className="max-w-4xl mx-auto text-center px-6">
        <p className="text-sm text-muted" style={{ color: C.muted }}>
          © {new Date().getFullYear()} Literatura9. Toate drepturile rezervate.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link href="/about" className="text-sm font-medium transition hover:text-accent">
            Despre
          </Link>
          <Link href="/contact" className="text-sm font-medium transition hover:text-accent">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}

/* =====================================================
    PAGINA PRINCIPALĂ
    ===================================================== */
export default function HomePage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  return (
    <main className="min-h-screen" style={{ background: C.bg }}>
      {/* HERO */}
      <Hero />

      {/* DESPRE / MANIFEST */}
      <Manifest />

      {/* FEATURES */}
      <Features />

      {/* CALL-TO-ACTION */}
      <CTA />

      {/* SOCIAL PROOF */}
      <SocialProof />

      {/* FOOTER */}
      <Footer />
    </main>
  );
}
