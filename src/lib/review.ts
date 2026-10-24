import "server-only";
import { runAgent } from "./agenticorg";
import type { Listing } from "./store";

// Listing Reviewer: an AgenticOrg agent (ops) checks every new listing before it's public.
// Approve → live. Flag or low confidence → "pending" until a person on the team approves at /review.
// If the agent is unreachable we don't block the seller: the listing goes live, marked "unchecked".

// "Sellit Listing Reviewer", created in our AgenticOrg workspace. Flags come back as hitl_triggered and show up in
// AgenticOrg → Approvals; the listing stays "pending" until a person approves it.
export const LISTING_REVIEWER = {
  name: "Listing Reviewer",
  id: process.env.AGENTICORG_REVIEWER_ID || "d8bcaffb-7fdc-42d9-be95-d3adea90e3c7",
};

export type Review = {
  status: "approved" | "pending" | "rejected" | "unchecked";
  reasons: string[];
  confidence: number | null;
  decidedBy: "agent" | "human";
  decidedAt: string;
  /** AgenticOrg's id for the run (matches the request in its Approvals page). */
  agentRunId?: string | null;
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
    "",
    // summary + fix_type are what AgenticOrg's approval card displays to the human approver.
    "Return ONLY this JSON:",
    '{"status": "approved" | "flagged", "reasons": ["short, specific reason", ...],',
    ' "summary": "One sentence for the human approver: which listing, what you decided and why.",',
    ' "fix_type": "approve_listing" | "hold_listing"}',
  ].join("\n");

  const run = await runAgent(LISTING_REVIEWER, { task }, listing.slug);
  const now = new Date().toISOString();
  if (run.status === "error" || run.status === "failed" || run.status === "budget_exceeded") {
    return { status: "unchecked", reasons: ["Reviewer unavailable"], confidence: null, decidedBy: "agent", decidedAt: now };
  }
  const out = (run.output ?? {}) as {
    status?: string;
    reasons?: string[];
    summary?: string;
    processing_trace?: string[];
    escalation_reason?: string | null;
  };
  const reasons = out.reasons ?? (out.processing_trace ?? []).slice(-3);
  const raw = (run.raw ?? {}) as { correlation_id?: string; run_id?: string };
  const agentRunId = raw.correlation_id ?? raw.run_id ?? null;
  // The agent's own verdict decides. A low-confidence approval still lands in AgenticOrg → Approvals
  // (hitl_triggered), but only an explicit flag holds the seller's link until a human approves it.
  const approved = out.status === "approved";
  return {
    status: approved ? "approved" : "pending",
    reasons: approved ? reasons : [out.summary ?? out.escalation_reason ?? "", ...reasons].filter(Boolean),
    confidence: run.confidence,
    decidedBy: "agent",
    decidedAt: now,
    agentRunId,
  };
}
