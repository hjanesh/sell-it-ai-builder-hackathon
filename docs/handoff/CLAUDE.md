# CLAUDE.md: Sell It (hackathon build, Oct 24 2026)

## Context
- We're a **team of 3** at Airtribe AI Builders Day '26 (Bengaluru), building **Sell It** (was ThriftIt, then BechDe):
  an AI selling assistant that turns photos plus a voice or text note into ready-to-post listings for OLX, Facebook
  Marketplace, Instagram and WhatsApp. Track: **AI for Commerce**.
- **The source of truth is `docs/SPEC.md`** (merged from `docs/handoff/` + `docs/BechDe-Pitch.md`). Items marked ❓ in it
  are still open: ask before building them.
- Hard deadlines today: submissions close **~17:00**, Round 1 judging is at **17:15**. **20 real, active users who
  give feedback** are a judged requirement (Traction is ~25–30% of the score).

## How to work here
- **Code:** Next.js 16 (App Router) + Tailwind 4 + Claude SDK; see `README.md` for the code map. Next 16 differs from older
  versions: check `node_modules/next/dist/docs/` before using a Next API (see `AGENTS.md`).
- **Speed with quality.** Ship a working vertical slice first, then add to it. A live deployed URL beats local features.
- **Don't build anything that isn't in the spec** without flagging it. If teammate docs conflict with the handoff,
  list the conflicts and ask; don't pick silently.
- Mobile-first UI. Most users arrive from WhatsApp on a phone.
- The **AI returns structured JSON** (schemas in code), never free-form text that we then parse.
- **Photo honesty rule:** enhance (crop, background, lighting), never alter the item. No generative re-drawing of products.
  Always keep one original photo.
- **No scraping** of OLX or Facebook Marketplace. Price comparisons come from web search, with links shown.
- Use sponsor tools only where they're truly needed (see `docs/handoff/04-tools-and-credits.md`).
- Keep secrets in `.env` (never commit them). Commit small and often; three people are pushing to the same repo.
