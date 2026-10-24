import { readFile } from "node:fs/promises";
import path from "node:path";

// The landing page is the design team's standalone HTML (src/app/landing/landing.html), served as-is so the
// design stays exactly as made. Its CTAs go to /new and its live counter reads /api/public-stats.
export async function GET(req: Request) {
  // Supabase falls back to the Site URL (this page) when a sign-in redirect isn't allow-listed:
  // pass the login code on to the callback so sign-in still completes.
  const search = new URL(req.url).search;
  if (new URLSearchParams(search).has("code")) {
    return new Response(null, { status: 307, headers: { location: `/auth/callback${search}` } });
  }
  const html = await readFile(path.join(process.cwd(), "src/app/landing/landing.html"), "utf8");
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
