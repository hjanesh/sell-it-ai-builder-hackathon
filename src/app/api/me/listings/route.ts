import { listingsForUser, userFromRequest } from "@/lib/store";
import { errorResponse } from "@/lib/claude";

export const dynamic = "force-dynamic";

/** The signed-in seller's listings (summary fields only). */
export async function GET(req: Request) {
  try {
    const user = await userFromRequest(req);
    if (!user) return Response.json({ error: "Please sign in" }, { status: 401 });
    const listings = await listingsForUser(user.id);
    return Response.json({
      user,
      listings: listings.map((l) => ({
        slug: l.slug,
        title: l.title,
        price: l.price,
        image: l.images[0] ?? null,
        created_at: l.created_at,
        listing_type: l.listing_type,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
