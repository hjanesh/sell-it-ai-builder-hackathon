import Link from "next/link";
import { getStatsData, recentAgentRuns, usingSupabase } from "@/lib/store";
import { formatINR } from "@/lib/format";
import { AutoRefresh } from "@/components/Track";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { pre_owned: "Pre-owned", new: "New", homemade: "Homemade" };

export default async function Stats() {
  const [{ listings, feedback, events }, agentRuns] = await Promise.all([getStatsData(), recentAgentRuns(30)]);
  const users = new Set(listings.map((l) => l.seller_whatsapp)).size;
  const value = listings.reduce((s, l) => s + (l.price || 0), 0);
  const rated = feedback.filter((f) => f.thumbs);
  const upRate = rated.length ? Math.round((rated.filter((f) => f.thumbs === "up").length / rated.length) * 100) : null;
  const shares = events.filter((e) => e.name === "shared" || e.name === "exported" || e.name === "copied").length;
  const views = events.filter((e) => e.name === "page_viewed").length;
  const proInterest = events.filter((e) => e.name === "pro_interest").length;
  const proPaid = events.filter((e) => e.name === "pro_paid").length;
  const byType = Object.entries(
    listings.reduce<Record<string, number>>((acc, l) => ({ ...acc, [l.listing_type]: (acc[l.listing_type] ?? 0) + 1 }), {}),
  );
  const quotes = feedback.filter((f) => f.comment.trim()).slice(0, 8);

  const tiles = [
    ["Sellers", users],
    ["Listings made", listings.length],
    ["Worth listed", `₹${formatINR(value)}`],
    ["👍 rate", upRate === null ? "–" : `${upRate}%`],
    ["Shares & exports", shares],
    ["Listing page views", views],
    ["Want the Pro video", proInterest],
    ["Paid for Pro (UPI, to verify)", proPaid],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <AutoRefresh seconds={20} />
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          Sell<span className="text-pink"> It</span>
        </Link>
        <span className="text-xs text-muted">Live · refreshes every 20s{usingSupabase() ? "" : " · local store"}</span>
      </header>
      <h1 className="mt-6 text-3xl font-medium tracking-tight">Today on Sell It</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map(([label, v]) => (
          <div key={label} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-1 text-3xl font-medium tracking-tight tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      {byType.length > 0 && (
        <p className="mt-3 text-sm text-muted">{byType.map(([t, n]) => `${TYPE_LABEL[t] ?? t}: ${n}`).join(" · ")}</p>
      )}

      <h2 className="mt-8 text-xl font-semibold">What sellers say</h2>
      {quotes.length === 0 ? (
        <p className="mt-2 text-muted">No comments yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {quotes.map((f) => (
            <li key={f.id} className="rounded-2xl bg-surface p-3 shadow-sm">
              <span className="mr-2">{f.thumbs === "up" ? "👍" : f.thumbs === "down" ? "👎" : "💬"}</span>
              {f.comment}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 text-xl font-semibold">Agent activity (AgenticOrg)</h2>
      {agentRuns.length === 0 ? (
        <p className="mt-2 text-muted">No agent runs yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-line text-sm">
          {agentRuns.map((r) => (
            <li key={r.id} className="flex justify-between gap-3 py-2">
              <span className="line-clamp-1">
                <span className="font-semibold">{r.agent}</span>
                {r.listing_slug ? ` · ${r.listing_slug}` : ""}
              </span>
              <span className="shrink-0 tabular-nums text-muted">
                {r.status === "hitl_triggered" ? "⏸ needs approval" : r.status} ·{" "}
                {new Date(r.created_at).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 text-xl font-semibold">Latest listings</h2>
      <ul className="mt-3 flex flex-col divide-y divide-line">
        {listings.slice(0, 15).map((l) => (
          <li key={l.id}>
            <Link href={`/l/${l.slug}`} className="flex justify-between gap-3 py-2">
              <span className="line-clamp-1">{l.title}</span>
              <span className="shrink-0 font-semibold">
                ₹{formatINR(l.price)}{" "}
                <span className="font-normal text-muted tabular-nums">
                  · {new Date(l.created_at).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
