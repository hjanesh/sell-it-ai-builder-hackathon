import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const client = new Anthropic();
// Haiku: ~20x cheaper than Sonnet per token, and good enough for detect/packs/price.
export const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-5-5";

// Server-side refusal fallback ("default" routing by refusal category). Haiku has none, so we skip it there.
export const FALLBACK = MODEL.startsWith("claude-haiku")
  ? {}
  : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

export const SYSTEM_BASE = `You are Sell It, the marketing team for home sellers in India: people selling old things,
new/unused stock, and homemade or small-batch products (food, crafts) through OLX, Facebook Marketplace,
Instagram, WhatsApp groups and a shareable listing page.
Rules:
- Prices are in Indian rupees. Use Indian conventions (₹, lakh, local areas).
- Never invent facts about the item. If something isn't visible or stated, leave it out or ask.
- Be honest about condition and defects: buyers trust the seller who is upfront.
- The seller's note and answers override what the photos seem to show. Never write "no tears", "no scratches"
  or similar about anything the seller says is damaged; if unsure, leave the claim out.
- Write like a real, friendly Indian seller, not like an ad agency. No exaggeration, no fake urgency.`;

/** Turns a data URL into an image content block. */
export function imageBlock(dataUrl: string): Anthropic.Beta.BetaImageBlockParam {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Images must be base64 JPEG/PNG/WebP data URLs");
  return {
    type: "image",
    source: { type: "base64", media_type: match[1] as "image/jpeg" | "image/png" | "image/webp", data: match[2] },
  };
}

export class RefusalError extends Error {}

/** Maps SDK/route errors to a JSON response the UI can show. */
export function errorResponse(error: unknown): Response {
  console.error(error);
  if (error instanceof RefusalError) {
    return Response.json({ error: "We couldn't process this item. Try a different photo." }, { status: 422 });
  }
  if (error instanceof Anthropic.RateLimitError) {
    return Response.json({ error: "Too many people selling right now. Try again in a few seconds." }, { status: 429 });
  }
  if (error instanceof Anthropic.AuthenticationError || (error instanceof Error && error.message.includes("authentication method"))) {
    return Response.json({ error: "Server is missing a valid ANTHROPIC_API_KEY." }, { status: 500 });
  }
  if (error instanceof Anthropic.APIError) {
    return Response.json({ error: `AI error (${error.status}). Please retry.` }, { status: 502 });
  }
  if (error instanceof Error && error.name === "ZodError") {
    return Response.json({ error: "Invalid request", detail: error.message }, { status: 400 });
  }
  return Response.json({ error: "Something went wrong. Please retry." }, { status: 500 });
}
