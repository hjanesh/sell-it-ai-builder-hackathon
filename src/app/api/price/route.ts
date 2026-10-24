import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { client, MODEL, FALLBACK, SYSTEM_BASE, errorResponse, RefusalError } from "@/lib/claude";
import { ItemContext, PriceResult, type Comp } from "@/lib/schemas";
import { describeItem } from "@/lib/describe";

export const maxDuration = 90;

const priceSchema = z.toJSONSchema(PriceResult) as Record<string, unknown>;
delete priceSchema.$schema;

const TOOLS: Anthropic.Beta.BetaToolUnion[] = [
  {
    type: "web_search_20260209",
    name: "web_search",
    max_uses: 4,
    user_location: { type: "approximate", country: "IN", city: "Bengaluru", region: "Karnataka", timezone: "Asia/Kolkata" },
  },
  {
    name: "submit_price",
    description: "Submit the final price suggestion and the comparable listings you found. Call exactly once, at the end.",
    strict: true,
    input_schema: priceSchema as Anthropic.Beta.BetaTool.InputSchema,
  },
];

const PROMPT = `Suggest a fair selling price in India for this item.

1. Use web_search to find up to 5 comparable listings or products with a visible rupee price.
   For pre-owned items, search used prices first, e.g. \`"<brand model>" site:olx.in\`, then Cashify or Quikr,
   then the new price (Amazon, Flipkart, Smartprix) as a ceiling. For homemade items: BigBasket/Swiggy Instamart,
   Instagram shops, local bakery or craft pages. Prefer the same model/variant and condition.
2. Only include comps you actually saw in the search results, with their exact URL and the price text as shown.
   Never make up a listing, URL or price. If you found nothing reliable, return an empty comps list.
3. Give a ₹ range (low, high) and a recommended price that will sell in about a week, with 2-4 short reasons
   (age, condition, bill/warranty, demand, what's included; for homemade: ingredients, portion, local rates).
4. Finish by calling submit_price.`;

export async function POST(req: Request) {
  try {
    const ctx = ItemContext.parse(await req.json());
    const messages: Anthropic.Beta.BetaMessageParam[] = [
      { role: "user", content: `${PROMPT}\n\n${describeItem(ctx)}` },
    ];

    const seenUrls = new Set<string>();
    let result = null as PriceResult | null;

    for (let turn = 0; turn < 4 && !result; turn++) {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        ...FALLBACK,
        output_config: { effort: "medium" },
        system: SYSTEM_BASE,
        tools: TOOLS,
        messages,
      });
      if (response.stop_reason === "refusal") throw new RefusalError();

      for (const block of response.content) {
        if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
          for (const r of block.content) seenUrls.add(normalizeUrl(r.url));
        }
        if (block.type === "tool_use" && block.name === "submit_price") {
          result = PriceResult.parse(block.input);
        }
      }
      if (result) break;

      messages.push({ role: "assistant", content: response.content });
      if (response.stop_reason !== "pause_turn") {
        // The model ended without submitting: nudge it once more.
        messages.push({ role: "user", content: "Now call submit_price with your final answer." });
      }
    }
    if (!result) throw new Error("Price step finished without a submit_price call");

    // Show a comp only if its URL came back from web search and the price text has a rupee figure.
    const comps = result.comps.filter(
      (c: Comp) => seenUrls.has(normalizeUrl(c.url)) && /₹|\brs\.?\s*\d|\binr\b/i.test(c.priceText),
    );
    return Response.json({ ...result, comps: comps.slice(0, 5) } satisfies PriceResult);
  } catch (error) {
    return errorResponse(error);
  }
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}`;
  } catch {
    return url;
  }
}
