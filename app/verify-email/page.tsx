"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("loading");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  const sent = searchParams.get("sent");

  async function handleResend() {
    setResending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      await supabase.auth.resend({ type: "signup", email: user.email });
    }
    setResending(false);
    setMessage("Email de confirmare retrimis. Verifică inbox-ul.");
  }

  useEffect(() => {
    const verifyEmail = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const code = searchParams.get("code");

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as "signup" | "recovery" | "email_change",
        });

        if (error) {
          setStatus("error");
          setMessage(error.message);
        } else {
          setStatus("success");
          setMessage("Email verificat cu succes!");
          setTimeout(() => router.push("/onboarding"), 1500);
        }
      } else if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus("error");
          setMessage(error.message);
        } else if (data.session) {
          setStatus("success");
          setMessage("Email verificat cu succes!");
          setTimeout(() => router.push("/onboarding"), 1500);
        }
      } else {
        if (sent === "true") {
          setStatus("pending");
          setMessage("Email-ul de confirmare a fost trimis. Verifică inbox-ul și folderul spam.");
        } else {
          setStatus("pending");
          setMessage("Se așteptă confirmarea email-ului. Verifică inbox-ul pentru link-ul de confirmare.");
        }
      }
    };

    void verifyEmail();
  }, [searchParams, router, sent]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email_confirmed_at) {
        setStatus("success");
        setMessage("Email verificat! Vei fi redirecționat...");
        setTimeout(() => router.push("/login"), 1500);
      }
    });

    return () => data?.subscription.unsubscribe();
  }, [router]);

  return (
    <main className="max-w-md mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold mb-6">
        Verificare email
      </h1>

      {status === "loading" && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Se verifică email-ul...
        </div>
      )}

      {status === "pending" && (
        <div>
          <div className="rounded-xl border border-yellow-100 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
            {message}
          </div>
          <button
            onClick={() => void handleResend()}
            disabled={resending}
            className="mt-4 text-sm underline text-blue-600"
          >
            {resending ? "Se trimite..." : "Retransmite email-ul de confirmare"}
          </button>
        </div>
      )}

      {status === "success" && (
        <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {status === "error" && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}. <button onClick={() => router.push("/signup")} className="underline">Încearcă din nou</button>
        </div>
      )}
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="max-w-md mx-auto p-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Verificare email</h1>
        <div>Se încarcă...</div>
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}