import { z } from "zod";
import { nanoid } from "nanoid";
import { insertEvent } from "@/lib/store";
import { errorResponse } from "@/lib/claude";

const Body = z.object({
  name: z.enum(["exported", "shared", "copied", "page_viewed", "opened_platform", "pro_interest", "pro_paid"]),
  listingSlug: z.string().nullable(),
  channel: z.string().nullable(),
});

export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    await insertEvent({ id: nanoid(), created_at: new Date().toISOString(), listing_slug: b.listingSlug, name: b.name, channel: b.channel });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
