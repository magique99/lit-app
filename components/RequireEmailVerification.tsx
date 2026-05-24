"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RequireEmailVerification({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (user.email_confirmed_at) {
        setVerified(true);
      } else {
        setVerified(false);
        setTimeout(() => router.push("/verify-email?sent=true"), 1500);
      }
      setChecking(false);
    };

    void checkVerification();
  }, [router]);

  if (checking) {
    return <div className="text-center py-12 text-slate-500 text-sm">Se verifică contul...</div>;
  }

  if (!verified) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Email neconfirmat</h2>
        <p className="text-slate-600 mb-4">
          Pentru a accesa această pagină, trebuie să confirmi adresa de email.
        </p>
        <button
          onClick={() => router.push("/verify-email?sent=true")}
          className="text-blue-600 underline"
        >
          Mergi la verificare
        </button>
      </div>
    );
  }

  return <>{children}</>;
}