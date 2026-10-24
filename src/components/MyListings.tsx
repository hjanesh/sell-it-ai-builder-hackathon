"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authHeader, displayName, signInWithGoogle, signOut, useSession } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { Button, CopyButton, Spinner } from "./ui";

type Item = { slug: string; title: string; price: number; image: string | null; created_at: string };

/** The seller's home after sign-in: everything they're selling, each with its own shareable link. */
export default function MyListings() {
  const session = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    authHeader()
      .then((auth) => fetch("/api/me/listings", { headers: auth }))
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Couldn't load your listings");
        setItems(j.listings);
      })
      .catch((e) => setError(e.message));
  }, [session]);

  if (session === undefined) return <Spinner label="Loading…" />;
  if (session === null)
    return (
      <div className="flex flex-col gap-5 pt-6">
        <h1 className="display-md balance">Sign in to see your listings.</h1>
        <Button onClick={() => signInWithGoogle("/me")}>Continue with Google</Button>
      </div>
    );

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <p className="caption-up text-muted">My listings</p>
        <h1 className="display-sm mt-2 balance">Hi {displayName(session).split(" ")[0] || "there"}, here&apos;s what you&apos;re selling.</h1>
      </div>
      <Link href="/new" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 font-semibold text-brand-ink">
        + Sell something new
      </Link>
      {error && <p className="text-sm text-error">{error}</p>}
      {items === null && !error ? (
        <Spinner label="Loading your listings…" />
      ) : items && items.length === 0 ? (
        <p className="body-md text-muted">Nothing yet. Snap your first thing: it takes about a minute.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {items?.map((l) => (
            <li key={l.slug} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <Link href={`/l/${l.slug}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.image ? <img src={l.image} alt="" className="aspect-square w-full object-cover" /> : <div className="aspect-square bg-cream" />}
              </Link>
              <div className="flex flex-col gap-2 p-3">
                <p className="line-clamp-2 text-sm font-semibold">{l.title}</p>
                <p className="text-sm">₹{formatINR(l.price)}</p>
                <CopyButton text={`${origin}/l/${l.slug}`} label="Copy link" />
              </div>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="text-sm text-muted underline" onClick={() => signOut()?.then(() => router.push("/"))}>
        Sign out
      </button>
    </div>
  );
}
