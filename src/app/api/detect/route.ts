import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { client, MODEL, FALLBACK, SYSTEM_BASE, imageBlock, errorResponse, RefusalError } from "@/lib/claude";
import { DetectRequest, DetectResult } from "@/lib/schemas";
import { runAgent } from "@/lib/agenticorg";

// The Appraiser agent on AgenticOrg (created in the AgenticOrg UI) double-checks the identification from text.
const APPRAISER = { name: "Appraiser", id: process.env.AGENTICORG_APPRAISER_ID || "71320052-a9fb-40a6-9a11-4c72c81a9fe0" };

export const maxDuration = 60;

const PROMPT = `Look at the photo(s) and the seller's note. Work out what is being sold.

1. listingType: pre_owned (used/old), new (unused, sealed or shop stock) or homemade (food, crafts, small batch).
2. title, category, brand, model and visible attributes. Read model numbers, labels and sizes from the photo when visible.
3. conditionCues: what the photos actually show (scratches, wear, packaging, freshness). Empty for homemade if not relevant.
4. missingEvidence: up to 3 photos or details that would make buyers trust this listing more
   (e.g. "Photo with the screen on", "Photo of the bill", "Close-up of the label", "Photo of one piece cut open").
5. itemBox: the main item's bounding box in the FIRST photo, as fractions of width and height.
6. questions: only the 3-6 questions that matter most for THIS item and listing type, most important first.
   Pre-owned: when bought, bill/box/warranty, defects, what's included, reason for selling, location.
   New: sealed/open box, MRP, warranty, quantity/variants, location.
   Homemade: what's in the batch, price per unit/box, minimum order, veg/eggless/allergens/shelf life,
   order-by/ready-by, pickup/delivery area.
   Prefer chips with 2-5 short options. Set prefilled when the photo or note already answers it.
   Always include a "location" text question (area, city) unless the note already gives it.`;

export async function POST(req: Request) {
  try {
    const body = DetectRequest.parse(await req.json());
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      ...FALLBACK,
      output_config: { effort: "low", format: betaZodOutputFormat(DetectResult) },
      system: SYSTEM_BASE,
      messages: [
        {
          role: "user",
          content: [
            ...body.images.map(imageBlock),
            { type: "text", text: `${PROMPT}\n\nSeller's note: ${body.caption || "(none)"}` },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) throw new RefusalError();
    const d = response.parsed_output;
    // Runs alongside, never slows the seller down; every run is logged for the agent activity log.
    void runAgent(APPRAISER, {
      task: `Seller says: ${body.caption || "(no note)"}. Our photo observations: ${d.title}; ${[...d.attributes.map((a) => `${a.label}: ${a.value}`), ...d.conditionCues].join("; ")}.`,
    });
    return Response.json(d);
  } catch (error) {
    return errorResponse(error);
  }
}
