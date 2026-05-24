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

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
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
    accent: "#B87D4B",
  };

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-medium" style={{ color: C.text }}>
            {mode === "login" ? "Conectare" : "Înregistrare"}
          </h1>
          <p className="mt-2 text-sm" style={{ color: C.muted }}>
            {mode === "login"
              ? "Intră în contul tău existent"
              : "Creează cont nou dacă nu ai unul"}
          </p>
        </div>

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

            <button
              onClick={mode === "login" ? handleLogin : handleRegister}
              disabled={loading}
              className="w-full rounded-full px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              style={{ backgroundColor: C.accent }}
            >
              {loading ? "Se procesează..." : mode === "login" ? "Conectare" : "Înregistrare"}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-sm transition-colors"
            style={{ color: C.accent }}
          >
            {mode === "login"
              ? "Nu ai cont? Înregistrează-te"
              : "Ai deja cont? Conectează-te"}
          </button>
        </div>
      </div>
    </main>
  );
}