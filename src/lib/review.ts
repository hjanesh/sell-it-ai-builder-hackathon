import "server-only";
import { runAgent } from "./agenticorg";
import type { Listing } from "./store";

// Listing Reviewer: an AgenticOrg agent (ops) checks every new listing before it's public.
// Approve → live. Flag or low confidence → "pending" until a person on the team approves at /review.
// If the agent is unreachable we don't block the seller: the listing goes live, marked "unchecked".

// With AGENTICORG_REVIEWER_ID set (an agent created in the AgenticOrg UI), that agent runs by its UUID;
// otherwise AgenticOrg's pre-built support_triage agent runs by type (it doesn't appear in the workspace's agent list).
export const LISTING_REVIEWER = {
  name: "Listing Reviewer",
  id: process.env.AGENTICORG_REVIEWER_ID || undefined,
  type: process.env.AGENTICORG_REVIEWER_TYPE ?? "support_triage",
};

export type Review = {
  status: "approved" | "pending" | "rejected" | "unchecked";
  reasons: string[];
  confidence: number | null;
  decidedBy: "agent" | "human";
  decidedAt: string;
};

export async function reviewListing(listing: Listing): Promise<Review> {
  const d = listing.data as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const price = d.price as { comps?: { source: string; priceText: string }[] } | null;
  const task = [
    "Review this listing before it goes public on Sell It (home sellers in India).",
    "Decide approve or flag. Flag ONLY for: (1) banned, unsafe or illegal items; (2) claims that clearly contradict what",
    "the seller said; (3) an asking price far above every comparable (a low price is the seller's choice, not a problem).",
    "Do NOT flag for photo quality, missing comparables, or details you can't verify: approve those.",
    "Give short reasons.",
    `Listing: ${listing.title}. Type: ${listing.listing_type}. Asking price: ${listing.price} rupees.`,
    `Seller's note: ${d.detect?.caption ?? ""} ${Object.values(d.answers ?? {}).join("; ")}`.trim(),
    `Photo observations: ${(d.detect?.conditionCues ?? []).join("; ")}`,
    `Comparable prices found: ${(price?.comps ?? []).map((c) => `${c.source} ${c.priceText}`).join("; ") || "none"}`,
  ].join("\n");

  const run = await runAgent(LISTING_REVIEWER, { task }, listing.slug);
  const now = new Date().toISOString();
  if (run.status === "error" || run.status === "failed" || run.status === "budget_exceeded") {
    return { status: "unchecked", reasons: ["Reviewer unavailable"], confidence: null, decidedBy: "agent", decidedAt: now };
  }
  const out = (run.output ?? {}) as { status?: string; processing_trace?: string[]; escalation_reason?: string | null };
  const reasons = (out.processing_trace ?? []).slice(-3);
  const approved = out.status === "approved" && run.status === "completed" && (run.confidence ?? 0) >= 0.85;
  return {
    status: approved ? "approved" : "pending",
    reasons: approved ? reasons : [out.escalation_reason ?? "", ...reasons].filter(Boolean),
    confidence: run.confidence,
    decidedBy: "agent",
    decidedAt: now,
  };
}
