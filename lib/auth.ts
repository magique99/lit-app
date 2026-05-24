import { supabase } from "./supabaseClient";

export async function requireEmailVerification(): Promise<{
  verified: boolean;
  user: { id: string; email: string; email_confirmed_at: string | null } | null;
  error?: string;
}> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { verified: false, user: null, error: "Not authenticated" };
  }

  return {
    verified: !!user.email_confirmed_at,
    user: {
      id: user.id,
      email: user.email || "",
      email_confirmed_at: user.email_confirmed_at,
    },
  };
}

export async function resendVerificationEmail(email: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });
  return error ? { error: error.message } : {};
}