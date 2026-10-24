import { z } from "zod";
import { customAlphabet, nanoid } from "nanoid";
import { insertListing, uploadImages } from "@/lib/store";
import { errorResponse } from "@/lib/claude";

const slugId = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 7);

const CreateListing = z.object({
  seller: z.object({ name: z.string().min(1).max(80), whatsapp: z.string().min(8).max(20) }),
  listingType: z.string(),
  title: z.string().max(200),
  price: z.number(),
  images: z.array(z.string().startsWith("data:image/jpeg;base64,")).min(1).max(7),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  try {
    const body = CreateListing.parse(await req.json());
    const slug = `${body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}-${slugId()}`;
    const images = await uploadImages(slug, body.images);
    await insertListing({
      id: nanoid(),
      slug,
      created_at: new Date().toISOString(),
      seller_name: body.seller.name,
      seller_whatsapp: body.seller.whatsapp.replace(/[^\d+]/g, ""),
      listing_type: body.listingType,
      title: body.title,
      price: Math.round(body.price),
      images,
      data: body.data,
    });
    return Response.json({ slug, images });
  } catch (error) {
    return errorResponse(error);
  }
}
