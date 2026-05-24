"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import OnboardingWizard from "@/components/OnboardingWizard";
import RequireEmailVerification from "@/components/RequireEmailVerification";

function OnboardingContent() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.preferences || !profile.preferences.genres || profile.preferences.genres.length === 0) {
        setNeedsOnboarding(true);
      } else {
        router.push("/");
      }
      setChecking(false);
    };

    void checkOnboarding();
  }, [router]);

  if (checking) {
    return <div className="text-center py-12 text-slate-500 text-sm">Se încarcă...</div>;
  }

  if (!needsOnboarding) return null;

  return <OnboardingWizard />;
}

export default function OnboardingPage() {
  return (
    <RequireEmailVerification>
      <OnboardingContent />
    </RequireEmailVerification>
  );
}