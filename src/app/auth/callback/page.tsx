"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth";
import { Spinner } from "@/components/ui";

/** Google sends the seller back here; Supabase swaps the code for a session, then we continue. */
export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function finish() {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/new";
      const code = params.get("code");
      const c = authClient();
      if (!c || !code) return setError(params.get("error_description") ?? "Sign-in didn't complete.");
      // detectSessionInUrl may already have exchanged the code; either way, check for a session after.
      await c.auth.exchangeCodeForSession(code).catch(() => null);
      const { data } = await c.auth.getSession();
      if (data.session) window.location.replace(next);
      else setError("Sign-in didn't complete.");
    }
    void finish();
  }, []);
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      {error ? (
        <p className="text-center text-error">
          {error} <a href="/new" className="underline">Try again</a>
        </p>
      ) : (
        <Spinner label="Signing you in…" />
      )}
    </main>
  );
}
