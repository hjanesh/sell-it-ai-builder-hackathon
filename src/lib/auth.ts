"use client";

import { useEffect, useState } from "react";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

// Google sign-in through Supabase Auth (PKCE). Without NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY the app falls
// back to the name + WhatsApp form, so local dev keeps working.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

let client: SupabaseClient | null = null;
export function authClient(): SupabaseClient | null {
  if (!URL || !KEY) return null;
  client ??= createClient(URL, KEY, { auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true } });
  return client;
}

export const authEnabled = () => Boolean(URL && KEY);

/** Current session (undefined while loading, null when signed out). */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(authEnabled() ? undefined : null);
  useEffect(() => {
    const c = authClient();
    if (!c) return;
    c.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = c.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

export function signInWithGoogle(next = "/new") {
  return authClient()?.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
}

export function signOut() {
  return authClient()?.auth.signOut();
}

/** Authorization header for our API routes, so listings are saved to the seller's account. */
export async function authHeader(): Promise<Record<string, string>> {
  const s = (await authClient()?.auth.getSession())?.data.session;
  return s ? { authorization: `Bearer ${s.access_token}` } : {};
}

export function displayName(session: Session | null | undefined): string {
  const m = session?.user.user_metadata ?? {};
  return (m.full_name as string) ?? (m.name as string) ?? "";
}
