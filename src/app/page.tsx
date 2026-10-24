import Link from "next/link";

// Placeholder landing. A teammate is building the real one; keep the "/new" link as the main CTA.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <p className="text-xl font-semibold tracking-tight">
        Sell<span className="text-pink"> It</span>
      </p>
      <h1 className="text-4xl font-semibold leading-tight">Big brands have marketing teams. Home sellers now have Sell It.</h1>
      <p className="text-lg text-muted">
        Snap one photo of what you&apos;re selling. In about a minute get the pitch, a fair price from real listings, clean photos and
        ready-to-post copy for WhatsApp, Instagram, OLX and Marketplace.
      </p>
      <Link href="/new" className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand px-6 text-lg font-semibold text-brand-ink">
        Make my listing, free →
      </Link>
      <p className="text-sm text-muted">Dosa batter, crochet, pickles, your old phone or the pram your baby outgrew. Anything.</p>
    </main>
  );
}
