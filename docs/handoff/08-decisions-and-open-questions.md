# 08: Decisions, open questions, risks (WIP)

## ✅ Decided
- Idea: **Sell It** (renamed from ThriftIt on Oct 24), an AI selling assistant for anything, on any channel. Track: **AI for Commerce**.
- Team of 3.
- Three listing types: pre-owned, new, homemade / small batch.
- Channels: OLX, Facebook Marketplace, Instagram, WhatsApp + our own listing page.
- Download everything + one-tap share is P0. "Post from us" today = share sheet + assisted posting + listing page.
- ElevenLabs for voice input. Render (or Replit) for hosting.
- Photo honesty rule. No scraping.

## ❓ Open: resolve in the merge with teammates' research
1. ~~Final name~~ ✅ **Sell It** (decided Oct 24, ~13:00).
2. **Stack** confirmation (Next.js + Render + Postgres?) and the **LLM** choice.
3. **Render Workflows**: go for the Render prize or not (test it in 30 minutes, then decide).
4. Which **flow to perfect first**: homemade (fastest users) vs pre-owned (strongest trust story)? Proposal: both P0, with homemade shipped first.
5. **Languages** for copy on day one (English + Hinglish proposed; Hindi/Kannada P1).
6. Background removal: client-side vs hosted.
7. Confirm with the organisers: **exact submission time** (~17:00?) and whether a **video** is required.
8. Teammates' ideas that aren't covered here (to be added).

## ⚠️ Risks
| Risk | Mitigation |
|---|---|
| Platforms building this natively (Meta US) | Multi-channel, India context, WhatsApp-first commerce |
| Users expect "auto-post to OLX/FB" | Be clear in the UI: "Post in 2 taps". Direct posting is roadmap via partner APIs. |
| Price estimates are wrong | Show a range + reasons + "estimate" label; comparable listings with links in P1 |
| AI photo edits misrepresent the item | Honesty rule; segmentation only; keep the original |
| Too broad for one day | One vertical slice done well first; generic fallback questions for any category |
| Image processing slow on phones | Downscale before processing; process in the background while the user answers questions |
| Not enough users by 17:00 | Soft launch 14:30; homemade sellers + WhatsApp groups; feedback built in |
| Privacy (photos of homes) | Store only what the listing page needs; say so in the UI |
