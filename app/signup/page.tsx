"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signup() {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const userId = data.user?.id;

    if (userId) {
      await supabase.from("profiles").insert({
        user_id: userId,
        username: email.split("@")[0],
        bio: "",
      });
    }

    router.push("/profile");
  }

  return (
    <main className="max-w-md mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">
        Sign up
      </h1>

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
          onClick={signup}
          className="bg-black text-white px-4 py-3 rounded-xl w-full"
        >
          Create account
        </button>

      </div>
    </main>
  );
}