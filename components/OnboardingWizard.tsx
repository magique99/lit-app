"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { GenrePreference } from "@/lib/types";

const GENRE_OPTIONS: GenrePreference[] = [
  "Poezie",
  "Proză",
  "Grotesc",
  "Simbolic",
  "SF",
  "Dramă",
  "Eseu",
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [selected, setSelected] = useState<GenrePreference[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleGenre = (genre: GenrePreference) => {
    setSelected((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  async function savePreferences() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ preferences: selected })
        .eq("user_id", user.id);
    }
    router.push("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F3EE]">
      <div className="max-w-md w-full mx-auto p-8">
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
                  selected.includes(genre)
                    ? "border-2 border-[#7D2626] bg-[#7D2626] text-white"
                    : "border border-[#E8E0D8] bg-white text-[#2A2520] hover:border-[#7D2626]"
                }
              `}
            >
              {genre}
            </button>
          ))}
        </div>

        <button
          onClick={() => void savePreferences()}
          disabled={loading || selected.length === 0}
          className="
            w-full py-3 rounded-xl bg-[#7D2626] text-white font-medium
            hover:bg-[#5D1D1D] disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {loading ? "Se salvează..." : "Continuă"}
        </button>

        {selected.length === 0 && (
          <p className="text-xs text-center mt-3" style={{ color: "#7A7268" }}>
            Selectează cel puțin un gen pentru a continua
          </p>
        )}
      </div>
    </main>
  );
}