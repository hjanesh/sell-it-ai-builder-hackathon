import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Persistence: Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, else a local JSON file
// (dev only: images stay inline as data URLs and the file resets on every Render deploy).

export type Listing = {
  id: string;
  slug: string;
  created_at: string;
  seller_name: string;
  seller_whatsapp: string;
  listing_type: string;
  title: string;
  price: number;
  images: string[];
  data: Record<string, unknown>;
};

export type Feedback = {
  id: string;
  created_at: string;
  listing_slug: string | null;
  thumbs: "up" | "down" | null;
  where_posting: string[];
  comment: string;
};

export type EventRow = { id: string; created_at: string; listing_slug: string | null; name: string; channel: string | null };

const BUCKET = "listing-images";

let supabase: SupabaseClient | null = null;
function db(): SupabaseClient | null {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  supabase ??= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return supabase;
}

export const usingSupabase = () => db() !== null;

// ---------- local fallback ----------
type LocalData = { listings: Listing[]; feedback: Feedback[]; events: EventRow[] };
const LOCAL_FILE = path.join(process.cwd(), ".data", "store.json");

async function readLocal(): Promise<LocalData> {
  try {
    return JSON.parse(await fs.readFile(LOCAL_FILE, "utf8"));
  } catch {
    return { listings: [], feedback: [], events: [] };
  }
}
async function writeLocal(data: LocalData) {
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(data));
}

// ---------- API ----------
export async function uploadImages(slug: string, dataUrls: string[]): Promise<string[]> {
  const sb = db();
  if (!sb) return dataUrls;
  return Promise.all(
    dataUrls.map(async (dataUrl, i) => {
      const [, base64] = dataUrl.split(",");
      const filePath = `${slug}/${i}.jpg`;
      const { error } = await sb.storage
        .from(BUCKET)
        .upload(filePath, Buffer.from(base64, "base64"), { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      return sb.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;
    }),
  );
}

export async function insertListing(listing: Listing) {
  const sb = db();
  if (sb) {
    const { error } = await sb.from("listings").insert(listing);
    if (error) throw error;
    return;
  }
  const data = await readLocal();
  data.listings.push(listing);
  await writeLocal(data);
}

export async function getListing(slug: string): Promise<Listing | null> {
  const sb = db();
  if (sb) {
    const { data, error } = await sb.from("listings").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data;
  }
  return (await readLocal()).listings.find((l) => l.slug === slug) ?? null;
}

export async function insertFeedback(row: Feedback) {
  const sb = db();
  if (sb) {
    const { error } = await sb.from("feedback").insert(row);
    if (error) throw error;
    return;
  }
  const data = await readLocal();
  data.feedback.push(row);
  await writeLocal(data);
}

export async function insertEvent(row: EventRow) {
  const sb = db();
  if (sb) {
    const { error } = await sb.from("events").insert(row);
    if (error) throw error;
    return;
  }
  const data = await readLocal();
  data.events.push(row);
  await writeLocal(data);
}

export async function getStatsData(): Promise<LocalData> {
  const sb = db();
  if (sb) {
    const [listings, feedback, events] = await Promise.all([
      sb.from("listings").select("id,slug,created_at,seller_name,seller_whatsapp,listing_type,title,price").order("created_at", { ascending: false }),
      sb.from("feedback").select("*").order("created_at", { ascending: false }),
      sb.from("events").select("*"),
    ]);
    for (const r of [listings, feedback, events]) if (r.error) throw r.error;
    return {
      listings: (listings.data ?? []) as Listing[],
      feedback: (feedback.data ?? []) as Feedback[],
      events: (events.data ?? []) as EventRow[],
    };
  }
  const data = await readLocal();
  return { ...data, listings: [...data.listings].reverse(), feedback: [...data.feedback].reverse() };
}
