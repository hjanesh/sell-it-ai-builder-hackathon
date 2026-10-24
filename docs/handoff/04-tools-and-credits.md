# 04: Tools and credits (WIP)

**Rule: use a sponsor tool only if it truly helps the product. No logo-stuffing.**
The tool-credits page (`assets/tool-credits.png`) lists credits for **Replit, Greptile, Render, ElevenLabs**.
Hemanth will claim them as needed.

| Tool | Credit on offer | Use? | Purpose |
|---|---|---|---|
| **Render** | Covers plan fee, compute, bandwidth | ✅ **Yes: hosting** | Web app, API, Postgres. **Render prize requires Render Workflows and/or Sandboxes.** |
| **ElevenLabs** | Emailed directly (check spam) | ✅ **Yes (P1): voice input** | Speech-to-text (Scribe) for voice notes in English, Hindi, Kannada and Hinglish → fills listing details. Speaking is easier than typing a form for many sellers. |
| Replit | One personal promo code | ⚪ Fallback only | Same job as Render; Render has the prize rule. |
| Greptile | 150 credits per org, 60-day expiry | ⚪ Optional, dev only | AI review of PRs from three people plus coding agents. Not part of the product or pitch. |
| Vobiz | None | ❌ Skip | Telephony / voice-agent infra; doesn't fit this flow. |
| Pine Labs | No credits listed | ⚪ P2 / pitch | A token-reservation payment story suits the judges. Today, use a plain `upi://pay` link. |

## Render Workflows: decide early
- Possible fit: the listing pipeline as a workflow (detect → image jobs fanned out per photo × platform size →
  copy generation → publish listing page), with retries. That's a real fit, not a forced one.
- **Rule:** adopt it only if a hello-world workflow runs within ~30 minutes. Otherwise use plain API routes and skip that prize.
- The details of Render Workflows and Sandboxes weren't researched yet. **Read Render's docs before committing.**

## Non-sponsor building blocks (proposed)
- **LLM:** a vision-capable Claude model (e.g. Sonnet 5.5) with structured JSON output. Teammates may propose others; decide in the merge.
- **Background removal:** segmentation model, client-side (e.g. `@imgly/background-removal`; **check its licence**) or a hosted model.
- **Image ops:** canvas (client) or `sharp` (server). **ZIP:** JSZip (client).
- **DB and storage:** Render Postgres + object storage, or Supabase.
- **Price comparisons (P1):** web search through the LLM provider's search tool. **Not** scraping.
