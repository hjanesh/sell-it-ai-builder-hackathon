import { listingsAwaitingReview } from "@/lib/store";
import { formatINR } from "@/lib/format";
import AppHeader from "@/components/AppHeader";
import ReviewButtons from "@/components/ReviewButtons";

export const dynamic = "force-dynamic";

/** Team-only queue: listings the Listing Reviewer agent flagged, waiting for a human decision. */
export default async function ReviewQueue({ searchParams }: PageProps<"/review">) {
  const key = (await searchParams).key;
  if (!process.env.REVIEW_KEY || key !== process.env.REVIEW_KEY) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-3">
        <AppHeader />
        <p className="body-md">Team only. Open this page with the review link.</p>
      </main>
    );
  }
  const queue = await listingsAwaitingReview();
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-3">
      <AppHeader />
      <p className="caption-up text-muted">Human approval</p>
      <h1 className="display-sm mt-2">Listings waiting for you ({queue.length})</h1>
      <p className="mt-2 text-sm text-muted">Flagged by the Listing Reviewer agent on AgenticOrg. Nothing here is public until you approve it.</p>
      <ul className="mt-5 flex flex-col gap-3">
        {queue.map((l) => {
          const review = (l.data as { review?: { reasons?: string[]; confidence?: number | null } }).review;
          return (
            <li key={l.slug} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.images[0] && <img src={l.images[0]} alt="" className="h-20 w-20 rounded-xl object-cover" />}
                <div>
                  <p className="font-semibold">{l.title}</p>
                  <p className="text-sm">₹{formatINR(l.price)} · {l.seller_name}</p>
                  <p className="text-xs text-muted">Agent confidence: {review?.confidence ?? "–"}</p>
                </div>
              </div>
              <ul className="mt-3 list-disc pl-5 text-sm text-body">
                {(review?.reasons ?? []).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <ReviewButtons slug={l.slug} reviewKey={key} />
            </li>
          );
        })}
        {queue.length === 0 && <p className="text-muted">Nothing to review right now.</p>}
      </ul>
    </main>
  );
}
