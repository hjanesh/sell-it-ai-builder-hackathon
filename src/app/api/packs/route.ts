import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { client, MODEL, FALLBACK, SYSTEM_BASE, errorResponse, RefusalError } from "@/lib/claude";
import { PacksRequest, PacksResult } from "@/lib/schemas";
import { describeItem } from "@/lib/describe";

export const maxDuration = 60;

const LANGUAGE: Record<string, string> = {
  en: "English",
  hinglish: "Hinglish (Hindi in Latin script mixed with English, the way people text in India)",
  hi: "Hindi in Devanagari script",
};

export async function POST(req: Request) {
  try {
    const body = PacksRequest.parse(await req.json());
    const lang = LANGUAGE[body.language];
    const prompt = `Write ready-to-post copy for every channel for this item.

${describeItem(body)}

Price: we fill it in later. Wherever the price goes, write exactly ₹{{PRICE}} (e.g. "*₹{{PRICE}}*").

Language: OLX and Marketplace in English (buyers search in English). WhatsApp, Instagram and the listing page in ${lang}.

- positioning: one sharp line on what this is and why it's worth buying.
- place: rank all 5 channels (whatsapp, instagram, olx, marketplace, listing_page) best-first for THIS item, each with a one-line reason.
  E.g. used electronics: olx, marketplace first. Homemade food: whatsapp (society groups) first. Crafts: instagram first.
- alsoConsider: other places worth it for this item (Cashify for phones, Etsy for crafts, etc.), or empty.
- olx: categoryPath as OLX India names it, title max 70 characters with brand/model/key spec, a structured
  description (what it is, age, condition incl. defects, what's included, reason for selling, pickup area),
  and details: the category-specific fields OLX asks for (brand, model, year, etc.) with values we know.
- marketplace: same facts, Marketplace style.
- instagram: caption with line breaks and emojis, 8-15 relevant hashtags (no #), storyText (max 8 words).
- whatsapp: four messages, each ready to paste:
  family (warm, casual), society (polite, short, for an apartment group, with price, availability and how to order/pick up),
  friends (casual), status (one line).
  Use *bold* for the item and price the WhatsApp way. Include the price. Don't add links; we append the listing link.
- listingPage: headline, description, and 3-5 FAQ a buyer would ask, answered only from known facts.
Never invent specs, defects, dates, or delivery promises the seller didn't give.`;

    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 12000,
      ...FALLBACK,
      output_config: { effort: "low", format: betaZodOutputFormat(PacksResult) },
      system: SYSTEM_BASE,
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) throw new RefusalError();
    return Response.json(response.parsed_output);
  } catch (error) {
    return errorResponse(error);
  }
}
