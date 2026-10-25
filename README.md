# Sell It

The marketing team for every home seller. Snap a photo → get the pitch, a fair price backed by real listings,
clean photos and ready-to-post copy for WhatsApp, Instagram, OLX and Marketplace, plus a shareable listing page.

Spec: [`docs/SPEC.md`](docs/SPEC.md) · Working rules: [`CLAUDE.md`](CLAUDE.md)

## Run locally
```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY (Supabase optional locally)
npm run dev                  # http://localhost:3000/new
```
Without Supabase, data goes to `.data/store.json` (gitignored), with images stored inline.
To test on your phone over the same Wi-Fi: `npm run dev -- -H 0.0.0.0`, then open `http://<laptop-ip>:3000/new`
(the share sheet needs HTTPS, so test sharing on the deployed URL).

## Routes
| Route | What |
|---|---|
| `/` | Placeholder landing (teammate's real landing page goes here) |
| `/new` | The flow: photos → detect → questions → results (packs, price, OLX/Marketplace guides, share, ZIP) |
| `/l/<slug>` | Public listing page with WhatsApp contact button |
| `/stats` | Live traction: sellers, listings, ₹ listed, 👍 rate, shares, feedback quotes |
| `POST /api/detect` | Photos + note → item, listing type, missing evidence, questions (one Claude call, JSON schema) |
| `POST /api/price` | Web search for comparable listings → ₹ range + comps (only URLs seen in search results) |
| `POST /api/packs` | Copy for every channel + Place ranking, with a `{{PRICE}}` token the UI fills |
| `POST /api/listings`, `/api/feedback`, `/api/events` | Persistence + analytics for `/stats` |

## Deploy (Render + Supabase)
1. Supabase: new project → SQL editor → run `supabase/schema.sql` (creates the tables + the public `listing-images` bucket).
2. Render: New → Blueprint → this repo (`render.yaml`). Set `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Model and cost
- Model: `CLAUDE_MODEL` (default `claude-haiku-5-5`). To change it on Render: sell-it → Environment → `CLAUDE_MODEL`,
  then redeploy. Render keeps the dashboard value even if `render.yaml` changes.
- On Haiku, `/api/price` uses basic web search (`web_search_20250305`): its searches fail with `invalid_tool_input` on
  the dynamic-filtering version. Sonnet/Opus use `web_search_20260209`. Haiku also has no server-side refusal fallback.
- Rough cost per listing on Haiku: ~$0.03–0.04, mostly the 3 web searches ($10 per 1,000). Sonnet was ~$0.20–0.25.
- Prompt caching is off on purpose: the shared prefix is a few hundred tokens and each request's photos/item text differ.

## Code map
- `src/lib/schemas.ts`: every AI input/output schema (zod) · `src/lib/claude.ts`: client, model (`CLAUDE_MODEL`), refusal fallback, errors
- `src/lib/images.ts`: photo studio (canvas: auto-levels, crop to item, blur-fill backdrop; never edits the item)
- `src/components/Flow.tsx`: capture + questions · `src/components/Results.tsx`: results, share, guided posting, feedback
- `src/lib/store.ts`: Supabase or local JSON fallback
