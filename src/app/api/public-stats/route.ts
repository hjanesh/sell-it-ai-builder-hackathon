import { getStatsData } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Counts only (no names or numbers) for the landing page's live counter. */
export async function GET() {
  const { listings } = await getStatsData();
  return Response.json({
    listings: listings.length,
    rupees: listings.reduce((s, l) => s + (l.price || 0), 0),
    sellers: new Set(listings.map((l) => l.seller_whatsapp)).size,
  });
}
