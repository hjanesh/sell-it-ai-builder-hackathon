# 05: Build plan (WIP)

## Principles
- **Live URL first** (within 30 minutes of starting code), then build features onto the deployed app.
- **One vertical slice end to end** before going broad: photos → detect → questions → studio → price → packs → share → feedback.
- **Structured AI only:** every LLM call returns JSON validated against a schema. The UI renders from JSON.
- **Mobile-first, polished UI** (Demo & Polish is 20% in Round 1). Use one design system; don't mix styles.

## Proposed stack (to confirm in the merge)
- **Next.js (App Router) + TypeScript + Tailwind + a component kit** (e.g. shadcn/ui), installable as a PWA.
- **Render** for hosting, Postgres for data, plus object storage for images. Render Workflows if adopted (see 04).
- Camera: `<input type="file" accept="image/*" capture="environment" multiple>`.
- Sharing: **Web Share API with files** (`navigator.share({ files, text })`), falling back to download plus a `wa.me/?text=` link.

## AI pipeline (each step = one call + one JSON schema)
1. `detect`: photos (+ voice transcript) → `{ listingType, category, title, brand, model, attributes, conditionCues, missingEvidence[], confidence }`
2. `questions`: detect output → `{ questions: [{ id, label, kind: chips|text|number|date, options?, prefilled? }] }` (only unanswered, most important first)
3. `price`: item + answers → `{ low, high, recommended, currency: "INR", reasons[], comps?[] }`
4. `packs`: item + answers + price → `{ olx: {title, description}, marketplace: {...}, instagram: {caption, hashtags}, whatsapp: {message, posterText}, faq[] }`
5. `transcribe` (ElevenLabs STT): audio → text, fed into steps 1–2.

## Images
- Segment → crop to the bounding box with padding → straighten → auto-levels/white balance → composite on a soft background + shadow.
- Export: 1:1, 4:3 (OLX/Marketplace), 4:5 (IG feed), 9:16 (IG story / WA status). Plus the untouched original.
- **WhatsApp poster/menu card** template for homemade (items, prices, order-by date, contact), rendered to PNG.

## Data (minimal)
- `users` (name, WhatsApp/email, created_at)
- `listings` (user_id, type, category, json_detect, json_answers, json_price, json_packs, image_urls, public_slug, created_at)
- `feedback` (listing_id, thumbs, where_posting, comment, created_at)
- `events` (listing_created, exported, shared_channel, page_viewed) for the `/stats` page

## Screens
1. Landing: hero, "Make my listing", examples (pre-owned / new / homemade)
2. Upload + voice note
3. Detect confirm (type chip + item name, editable)
4. Questions (chips, skippable, progress)
5. Results: photo studio carousel · price card · tabs per channel (copy buttons) · Download ZIP · Share · Post to OLX/Marketplace (assisted) · Publish listing page
6. Feedback sheet (after export or share)
7. Public listing page `/l/<slug>`
8. `/stats` (users, listings, ₹ listed, 👍 rate, latest feedback)

## Team split (3 people; adjust in the merge)
| Person | Owns |
|---|---|
| **A: Frontend/UX** | Screens 1–6, design system, share and download, polish |
| **B: AI** | Prompts + schemas for detect/questions/price/packs, ElevenLabs STT, (P1) price comparisons via web search |
| **C: Images + infra + users** | Image pipeline + poster template, listing page, `/stats`, DB, Render deploy (+ Workflows decision), leads user acquisition from ~15:00 |

## Priorities
| P0: must work perfectly | P1: after P0 is live | P2: stretch / pitch |
|---|---|---|
| Upload → detect → questions → studio → price → packs → ZIP + share → feedback + user capture; pre-owned + homemade flows | New-item flow polish, voice input, listing page + UPI reserve, listing-strength meter, price comparisons, Hindi/Kannada copy | AI buyer chat / negotiation, bulk mode, Pine Labs payments, direct posting via partner APIs, APK |

## Timeline (slide times)
| When | What |
|---|---|
| By 12:30 | Track locked (AI for Commerce) · repo + Render hello-world live · schemas drafted |
| 12:30–14:30 | P0 slice on the live URL |
| 14:30–15:00 | Soft launch to 5–10 friends; fix what breaks |
| 15:00–17:00 | User push + feedback coming in · P1 features · record the submission video |
| ~17:00 | Submit |
| 17:15 | Round 1: live demo + `/stats` |
| 19:00 | Stage demo (see 07) |
