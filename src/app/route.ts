import { readFile } from "node:fs/promises";
import path from "node:path";

// The landing page is the design team's standalone HTML (src/app/landing/landing.html), served as-is so the
// design stays exactly as made. Its CTAs go to /new and its live counter reads /api/public-stats.
export async function GET() {
  const html = await readFile(path.join(process.cwd(), "src/app/landing/landing.html"), "utf8");
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
