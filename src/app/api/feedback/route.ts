import { z } from "zod";
import { nanoid } from "nanoid";
import { insertFeedback } from "@/lib/store";
import { errorResponse } from "@/lib/claude";

const Body = z.object({
  listingSlug: z.string().nullable(),
  thumbs: z.enum(["up", "down"]).nullable(),
  wherePosting: z.array(z.string()).max(10),
  comment: z.string().max(2000),
});

export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    await insertFeedback({
      id: nanoid(),
      created_at: new Date().toISOString(),
      listing_slug: b.listingSlug,
      thumbs: b.thumbs,
      where_posting: b.wherePosting,
      comment: b.comment,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
