"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  async function signup() {
    setLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      setInfoMessage("Cont creat cu succes! Verifică email-ul pentru a confirma contul.");
      setLoading(false);
      return;
    }

    // Profile will be created after email verification during onboarding
    router.push("/onboarding");
  }

  return (
    <main className="max-w-md mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">
        Sign up
      </h1>

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {infoMessage && (
        <div className="mb-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
          {infoMessage}
        </div>
      )}

      <div className="space-y-4">

        <input
          type="email"
          placeholder="Email"
          className="w-full border rounded-xl p-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded-xl p-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={() => void signup()}
          disabled={loading}
          className="bg-black text-white px-4 py-3 rounded-xl w-full disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "Loading..." : "Create account"}
        </button>

      </div>
    </main>
  );
}
