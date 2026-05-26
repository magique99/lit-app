"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import type { GenrePreference, OnboardingRole } from "@/lib/types";
import { uploadAvatar } from "@/lib/uploadAvatar";

const GENRE_OPTIONS: GenrePreference[] = [
  "Poezie",
  "Proză",
  "Grotesc",
  "Simbolic",
  "SF",
  "Dramă",
  "Eseu",
];

const TEXT_TYPES = ["Poezie", "Proză", "Teatru", "Jurnal", "Altul"];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Profile fields
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [country, setCountry] = useState<string>("");

  // Preferences
  const [selectedGenres, setSelectedGenres] = useState<GenrePreference[]>([]);
  const [userRole, setUserRole] = useState<OnboardingRole>("reader");
  const [writesTypes, setWritesTypes] = useState<string[]>([]);
  const [readsTypes, setReadsTypes] = useState<string[]>([]);

  const toggleGenre = (genre: GenrePreference) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleWritesType = (type: string) => {
    setWritesTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleReadsType = (type: string) => {
    setReadsTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  async function savePreferences() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Check if email is confirmed
    if (!user.email_confirmed_at) {
      setLoading(false);
      router.push("/verify-email?sent=true");
      return;
    }

    // Handle avatar upload
    let finalAvatarUrl = avatarUrl;
    if (selectedFile) {
      try {
        const uploaded = await uploadAvatar(selectedFile, user.id);
        if (uploaded) {
          finalAvatarUrl = uploaded;
        }
      } catch {
        // fallback base64
        finalAvatarUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }
    }

    // Use upsert to handle both new profile creation and updates
    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        username: username || null,
        first_name: firstName || null,
        last_name: lastName || null,
        bio: bio || null,
        city: city || null,
        country: country || null,
        avatar_url: finalAvatarUrl,
        preferences: {
          genres: selectedGenres,
          role: userRole,
          writes_types: userRole === "writer" || userRole === "both" ? writesTypes : [],
          reads_types: userRole === "reader" || userRole === "both" ? readsTypes : [],
        },
      }, { onConflict: "user_id" });

    if (!error) {
      router.push("/");
    }
  }

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const C = {
    bg: "#F7F3EE",
    surface: "#FFFCF7",
    text: "#2A2520",
    muted: "#7A7268",
    border: "#E8E0D8",
    accent: "#7D2626",
    accentHover: "#5D1D1D",
  };

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="max-w-lg w-full mx-auto p-8">
        {/* Step 1: Profile Setup */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-serif font-medium mb-2 text-center" style={{ color: C.text }}>
              Completează-ți profilul
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: C.muted }}>
              Adaugă o poză și informații de bază pentru a-ți personaliza experiența.
            </p>

            {/* Avatar upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border border-slate-200/80 shrink-0 bg-slate-50 mb-3">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">?</div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium border-b border-slate-300 pb-0.5 text-slate-600 hover:text-slate-900 transition-colors"
              >
                Schimbă fotografia
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setAvatarUrl(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <p className="mt-1 text-[11px] text-slate-400">JPG, PNG sau WebP.</p>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <Field label="Nume de utilizator" value={username} onChange={setUsername} placeholder="username" />
              <Field label="Nume" value={firstName} onChange={setFirstName} placeholder="Nume" />
              <Field label="Prenume" value={lastName} onChange={setLastName} placeholder="Prenume" />
              <Field label="Oraș" value={city} onChange={setCity} placeholder="Oraș" />
              <Field label="Țară" value={country} onChange={setCountry} placeholder="Țară" />
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Despre</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Scrie câteva cuvinte despre tine…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-700 resize-none focus:border-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={nextStep}
                className="py-2 px-6 rounded-xl bg-[#7D2626] text-white font-medium hover:bg-[#5D1D1D]"
              >
                Continuă
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Genres */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-serif font-medium mb-2 text-center" style={{ color: C.text }}>
              Ce te interesează?
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: C.muted }}>
              Selectează genurile literare pentru a-ți personaliza feed-ul.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {GENRE_OPTIONS.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`
                    py-3 px-4 rounded-xl border text-sm font-medium transition-all
                    ${
                      selectedGenres.includes(genre)
                        ? "border-2 border-[#7D2626] bg-[#7D2626] text-white"
                        : "border border-[#E8E0D8] bg-white text-[#2A2520] hover:border-[#7D2626]"
                    }
                  `}
                >
                  {genre}
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={prevStep} className="py-2 px-4 text-sm text-[#7A7268] hover:text-[#2A2520]">
                Înapoi
              </button>
              <button
                onClick={nextStep}
                disabled={selectedGenres.length === 0}
                className="py-2 px-6 rounded-xl bg-[#7D2626] text-white font-medium hover:bg-[#5D1D1D] disabled:opacity-50"
              >
                Continuă
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Role */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-serif font-medium mb-6 text-center" style={{ color: C.text }}>
              Ce rol ți-ai dori?
            </h1>

            <div className="space-y-3 mb-6">
              {[
                { value: "reader", label: "Cititor", desc: "Citesc și apreciez texte" },
                { value: "writer", label: "Scriitor", desc: "Scriu și public texte" },
                { value: "both", label: "Ambele", desc: "Citesc și scriu" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setUserRole(option.value as OnboardingRole)}
                  className={`
                    w-full p-4 rounded-xl border text-left transition-all
                    ${
                      userRole === option.value
                        ? "border-2 border-[#7D2626] bg-[#7D2626]/5"
                        : "border border-[#E8E0D8] bg-white hover:border-[#7D2626]"
                    }
                  `}
                >
                  <div className="font-medium" style={{ color: C.text }}>{option.label}</div>
                  <div className="text-xs" style={{ color: C.muted }}>{option.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={prevStep} className="py-2 px-4 text-sm text-[#7A7268] hover:text-[#2A2520]">
                Înapoi
              </button>
              <button onClick={nextStep} className="py-2 px-6 rounded-xl bg-[#7D2626] text-white font-medium hover:bg-[#5D1D1D]">
                Continuă
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Writes types */}
        {step === 4 && (userRole === "writer" || userRole === "both") && (
          <div>
            <h1 className="text-2xl font-serif font-medium mb-2 text-center" style={{ color: C.text }}>
              Ce tipuri de texte scrii?
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: C.muted }}>
              Selectează tipurile de texte pe care le scrii cel mai des.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {TEXT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleWritesType(type)}
                  className={`
                    py-3 px-4 rounded-xl border text-sm font-medium transition-all
                    ${
                      writesTypes.includes(type)
                        ? "border-2 border-[#7D2626] bg-[#7D2626] text-white"
                        : "border border-[#E8E0D8] bg-white text-[#2A2520] hover:border-[#7D2626]"
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={prevStep} className="py-2 px-4 text-sm text-[#7A7268] hover:text-[#2A2520]">
                Înapoi
              </button>
              <button
                onClick={nextStep}
                disabled={writesTypes.length === 0}
                className="py-2 px-6 rounded-xl bg-[#7D2626] text-white font-medium hover:bg-[#5D1D1D] disabled:opacity-50"
              >
                Continuă
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Reads types (for reader only) */}
        {step === 4 && userRole === "reader" && (
          <div>
            <h1 className="text-2xl font-serif font-medium mb-2 text-center" style={{ color: C.text }}>
              Ce tipuri de texte citești?
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: C.muted }}>
              Selectează tipurile de texte pe care le citești cel mai des.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {TEXT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleReadsType(type)}
                  className={`
                    py-3 px-4 rounded-xl border text-sm font-medium transition-all
                    ${
                      readsTypes.includes(type)
                        ? "border-2 border-[#7D2626] bg-[#7D2626] text-white"
                        : "border border-[#E8E0D8] bg-white text-[#2A2520] hover:border-[#7D2626]"
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={prevStep} className="py-2 px-4 text-sm text-[#7A7268] hover:text-[#2A2520]">
                Înapoi
              </button>
              <button
                onClick={() => void savePreferences()}
                disabled={loading || readsTypes.length === 0}
                className="py-2 px-6 rounded-xl bg-[#7D2626] text-white font-medium hover:bg-[#5D1D1D] disabled:opacity-50"
              >
                {loading ? "Se salvează..." : "Finalizează"}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Reads types (for both) */}
        {step === 5 && userRole === "both" && (
          <div>
            <h1 className="text-2xl font-serif font-medium mb-2 text-center" style={{ color: C.text }}>
              Ce tipuri de texte citești?
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: C.muted }}>
              Selectează tipurile de texte pe care le citești cel mai des.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {TEXT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleReadsType(type)}
                  className={`
                    py-3 px-4 rounded-xl border text-sm font-medium transition-all
                    ${
                      readsTypes.includes(type)
                        ? "border-2 border-[#7D2626] bg-[#7D2626] text-white"
                        : "border border-[#E8E0D8] bg-white text-[#2A2520] hover:border-[#7D2626]"
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={prevStep} className="py-2 px-4 text-sm text-[#7A7268] hover:text-[#2A2520]">
                Înapoi
              </button>
              <button
                onClick={() => void savePreferences()}
                disabled={loading || readsTypes.length === 0}
                className="py-2 px-6 rounded-xl bg-[#7D2626] text-white font-medium hover:bg-[#5D1D1D] disabled:opacity-50"
              >
                {loading ? "Se salvează..." : "Finalizează"}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Final for writers */}
        {step === 5 && userRole === "writer" && (
          <div>
            <h1 className="text-2xl font-serif font-medium mb-6 text-center" style={{ color: C.text }}>
              Gata!
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: C.muted }}>
              Profilul tău de scriitor este pregătit. Poți să începi să publici texte!
            </p>

            <div className="flex justify-between">
              <button onClick={prevStep} className="py-2 px-4 text-sm text-[#7A7268] hover:text-[#2A2520]">
                Înapoi
              </button>
              <button
                onClick={() => void savePreferences()}
                disabled={loading}
                className="py-2 px-6 rounded-xl bg-[#7D2626] text-white font-medium hover:bg-[#5D1D1D]"
              >
                {loading ? "Se salvează..." : "Intră în aplicație"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ── SIMPLE FIELD ── */
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full rounded-xl border border-slate-200 bg-white
          px-4 py-3 text-[14px] text-slate-700
          placeholder:text-slate-300
          focus:border-slate-400 focus:outline-none
        "
      />
    </div>
  );
}