"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { GenrePreference, OnboardingRole } from "@/lib/types";

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

  // Step 1: Genres
  const [selectedGenres, setSelectedGenres] = useState<GenrePreference[]>([]);

  // Step 2: Role
  const [userRole, setUserRole] = useState<OnboardingRole>("reader");

  // Step 3: Text types (for writers)
  const [writesTypes, setWritesTypes] = useState<string[]>([]);

  // Step 4: Favorite text types (for readers)
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
    if (user) {
      const preferences = {
        genres: selectedGenres,
        role: userRole,
        writes_types: userRole === "writer" || userRole === "both" ? writesTypes : [],
        reads_types: userRole === "reader" || userRole === "both" ? readsTypes : [],
      };
      await supabase
        .from("profiles")
        .update({ preferences } as never)
        .eq("user_id", user.id);
    }
    router.push("/");
  }

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F3EE]">
      <div className="max-w-lg w-full mx-auto p-8">
        {/* Step 1: Genres */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-serif font-medium mb-2 text-center" style={{ color: "#2A2520" }}>
              Ce te interesează?
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: "#7A7268" }}>
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
              <div />
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

        {/* Step 2: Role */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-serif font-medium mb-6 text-center" style={{ color: "#2A2520" }}>
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
                  <div className="font-medium" style={{ color: "#2A2520" }}>{option.label}</div>
                  <div className="text-xs" style={{ color: "#7A7268" }}>{option.desc}</div>
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

        {/* Step 3: Writes types */}
        {step === 3 && (userRole === "writer" || userRole === "both") && (
          <div>
            <h1 className="text-2xl font-serif font-medium mb-2 text-center" style={{ color: "#2A2520" }}>
              Ce tipuri de texte scrii?
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: "#7A7268" }}>
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

        {/* Step 4: Reads types (or final for writers) */}
        {step === 4 && (userRole === "reader" || userRole === "both") && (
          <div>
            <h1 className="text-2xl font-serif font-medium mb-2 text-center" style={{ color: "#2A2520" }}>
              Ce tipuri de texte citești?
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: "#7A7268" }}>
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

        {/* Final step for writers only */}
        {step === 4 && userRole === "writer" && (
          <div>
            <h1 className="text-2xl font-serif font-medium mb-6 text-center" style={{ color: "#2A2520" }}>
              Gata!
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: "#7A7268" }}>
              Profilul tău de scriitor este pregătit. Poți să începi să publici texte!
            </p>

            <button
              onClick={() => void savePreferences()}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#7D2626] text-white font-medium hover:bg-[#5D1D1D]"
            >
              {loading ? "Se salvează..." : "Intră în aplicație"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}