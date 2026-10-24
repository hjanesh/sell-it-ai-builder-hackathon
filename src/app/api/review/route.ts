import { z } from "zod";
import { getListing, logAgentRun, updateListingData } from "@/lib/store";
import { errorResponse } from "@/lib/claude";

// Human-in-the-loop: a team member approves or rejects a listing the Listing Reviewer agent flagged.
const Decision = z.object({ key: z.string(), slug: z.string(), decision: z.enum(["approved", "rejected"]), reviewer: z.string().max(60) });

export async function POST(req: Request) {
  try {
    const body = Decision.parse(await req.json());
    if (!process.env.REVIEW_KEY || body.key !== process.env.REVIEW_KEY) return Response.json({ error: "Wrong review key" }, { status: 403 });
    const listing = await getListing(body.slug);
    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });
    const previous = (listing.data as { review?: Record<string, unknown> }).review ?? {};
    const decidedAt = new Date().toISOString();
    await updateListingData(body.slug, { review: { ...previous, status: body.decision, decidedBy: "human", reviewer: body.reviewer, decidedAt } });
    await logAgentRun({
      agent: `Human approval (${body.reviewer})`,
      agent_id: null,
      listing_slug: body.slug,
      status: body.decision,
      confidence: null,
      inputs: { agentReview: previous },
      output: { decision: body.decision },
      raw: null,
    }).catch((e) => console.error("approval log failed", e));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
