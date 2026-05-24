"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");

  async function handleLogin() {
    setErrorMessage(null);
    setMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleRegister() {
    setErrorMessage(null);
    setMessage(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else if (data.user && !data.session) {
      setMessage("Cont creat! Verifică email-ul pentru confirmare.");
    } else if (data.session) {
      setMessage("Cont creat cu succes! Vei fi redirecționat...");
      router.push("/");
      router.refresh();
    } else {
      setMessage("Cont creat. Verifică emailul pentru confirmare.");
    }
  }

  const C = {
    bg: "#F7F3EE",
    surface: "#FFFCF7",
    text: "#2A2520",
    muted: "#7A7268",
    border: "#E8E0D8",
    accent: "#7D2626",
    accentHover: "#5D1D1D",
  };

  const benefits = [
    "Publică texte",
    "Salvează favorite",
    "Comentează și urmărește autori",
  ];

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="w-full max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left: Form */}
          <div className="lg:order-1">
            {/* Title - Strong focus point */}
            <div className="text-center lg:text-left mb-10">
              <h1 className="font-serif text-3xl sm:text-4xl font-medium leading-tight" style={{ color: C.text }}>
                {mode === "login" ? "Conectează-te la Literatura9" : "Creează un cont"}
              </h1>
              <p className="mt-3 text-sm leading-relaxed max-w-md mx-auto lg:mx-0" style={{ color: C.muted }}>
                {mode === "login"
                  ? "Continuă lectura și scrisul acolo unde ai rămas."
                  : "Intră în comunitatea celor care scriu și citesc cu inima."}
              </p>
            </div>

            {/* Form */}
            <div className="rounded-3xl border p-8" style={{ background: C.surface, borderColor: C.border }}>
              {errorMessage && (
                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {message && (
                <div className="mb-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {message}
                </div>
              )}

              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors"
                  style={{ borderColor: C.border, color: C.text }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="Parolă"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors"
                  style={{ borderColor: C.border, color: C.text }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {/* Clear CTA - Dominant visual element */}
                <button
                  onClick={mode === "login" ? handleLogin : handleRegister}
                  disabled={loading}
                  className="w-full rounded-xl px-6 py-4 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
                  style={{ backgroundColor: C.accent }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = C.accentHover)}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = C.accent)}
                >
                  {loading ? "Se procesează..." : mode === "login" ? "Intră în cont" : "Creează cont"}
                </button>
              </div>
            </div>

            {/* Secondary action - lower visual weight */}
            <div className="mt-8 text-center lg:text-left">
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-sm transition-colors"
                style={{ color: C.accent }}
              >
                {mode === "login" ? "Nu ai cont? Creează unul" : "Ai deja cont? Conectează-te"}
              </button>
            </div>
          </div>

          {/* Right: Benefits (desktop only) */}
          <div className="hidden lg:block lg:order-2">
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-lg" style={{ color: C.accent }}>✓</span>
                  <span className="text-sm" style={{ color: C.muted }}>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}