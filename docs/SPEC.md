# Sell It: SPEC (merged draft v0.2, Oct 24 ~13:00 IST)

**Decided by Hemanth (13:00):** name **Sell It** · free for signed-up users, **product video = Pro**,
paid through a **sponsor gateway (Pine Labs)** · stack **Render + Supabase** · **price comps in P0** ·
**channels + posting UX (C4)**, see §1 and §7.
C12 + C13 decided (§1). Still open: C3, C6, C8, C10, C11 (Pro video).
The teammates' product description is merged into §1. Any further business/theme docs still need merging.

**Sources merged:** `docs/handoff/` (base plan, ~12:30) + `docs/BechDe-Pitch.md` (teammate pitch, written pre-kickoff).
If the third teammate has a doc, it still needs merging.

**Legend:** ✅ both docs agree · ➕ new from BechDe, no conflict (adopt unless someone objects) · ❓ conflict, team decides (see §12)

---

## 1. What it is
**Product description** (from the teammates, `handoff/teammates/product-description.md`):
> India's homes are full of tiny businesses: fresh dosa batter, crochet baskets, dreamcatchers, pickles. Most struggle
> to grow, because the seller is guessing at everything a big brand has a whole team for. 'Sell It' is the marketing
> team for every home business. Snap one photo, add a caption, and in 60 seconds get all 4 Ps of marketing: the right
> Product pitch, a fair Price backed by real listings, Promotion-ready photos and copy in your language, and the best
> Place to post. Big brands have marketing teams. Home sellers now have 'Sell It'.

- ➕ **Minimum input = 1 photo + a caption** (more photos and a voice note stay optional). **Speed target:** photo in → packs out in ≤ 60 s.
- ✅ **Who it's for (C12): homemade-led, all types.** Pitch and landing page lead with home businesses. Pre-owned and new stay in the product (one line in the pitch).
- ✅ **"4 Ps" (C13): submission text only.** On stage and in the UI: what to call it, what to charge, what to show, where to post.

✅ An AI selling assistant for anything sold from home: old stuff, new/unused stock, homemade/small batch.
Photos (+ voice/text note) in → identified item, smart questions, clean photos, fair price, ready-to-post copy per channel, a public listing page, one-tap share.
✅ Not a marketplace and not a full storefront. "We write the listing. You post with one tap."
✅ Name: **Sell It** (replaces ThriftIt / BechDe).

**The pitch (Hemanth, ~13:15).** It's not "AI writes your description". The seller does **the whole listing on Sell It**:
details, specs, description, captions, cleaned photos, price. Then they **send it straight out**:
- **WhatsApp and Instagram today**, one tap, in the formats each one actually uses (see §7).
- **OLX / FB Marketplace today:** exact copy-paste, with a **guide that follows the platform's own posting flow** step by step
  ("OLX asks for X next → here's X, tap to copy"). The UX has to be pakka.
- **Later:** direct posting to OLX and others through partner APIs.

## 2. Problem and insight
- ➕ **Problem (BechDe):** the *hesitation gap*. Selling needs five small decisions in a row (what is it, what's it worth, how to show it, where to post, which language). Together they're paralysing, so nothing gets listed.
- ✅ **Insight (handoff):** buyers trust the listing where the seller made an effort (clean photos + the details buyers check). Most sellers skip that effort; we do it for them.
- ➕ **Internal spine:** the 4 Ps. **Product** (what to call it), **Price** (what to charge), **Promotion** (what to show), **Place** (where to post). Say it in plain words on stage, not "4 Ps" (BechDe's own advice).

## 3. Users
✅ One persona: anyone selling from home. The AI detects the **listing type** (pre-owned · new/unused · homemade/small batch) and the user confirms with one tap. No "reseller vs maker" choice up front.

## 4. Flow
1. ✅ **Add photos** (1–6) + optional voice/text note.
2. ✅ **Detect:** item, category, brand/model, condition cues, listing type; flags missing evidence ("send the About screen", "show the bill").
3. ✅ **Smart questions:** only what matters for this type, all skippable, prefilled from photos/voice (question sets in `handoff/02-product-spec.md`).
   ➕ Homemade adds an **availability** setting: *Weekly batches / By request / One-off* (+ order-by day). Demo it on the homemade item.
4. ✅ **Photo studio:** crop, straighten, exposure/white balance, background clean-up + shadow, platform sizes, one untouched original. Honesty rule applies. ❓ Tool: C3.
5. **Price:** ✅ ₹ range + recommended figure + reasons, labelled as an estimate, **plus comparable listings with links in P0**.
   Comps come from web search (no scraping). Show only links that resolve and contain a ₹ figure, up to 5, and show none rather than a bad one.
6. **Packs per channel:** ✅ copy + images + hashtags. ➕ **Place:** the AI ranks channels for this item and highlights the top 2. ✅ Every channel gets a full pack (§7).
7. ✅ **Ship:** ZIP download · Web Share / `wa.me` · public listing page `/l/<slug>` with a WhatsApp contact button. Free for every signed-up user.
8. ✅ **Feedback** after every export/share: 👍/👎, "Where will you post?", comment.
9. ✅ **Pro: product video** (new; not in either source doc). A short vertical video for Reels / WA Status, paid through Pine Labs. How it's made is open: C11.

## 5. AI pipeline (each step = one call + one JSON schema)
✅ `detect` → `questions` → `price` → `packs`, plus `transcribe` (ElevenLabs STT, P1). Schemas as in `handoff/05-build-plan.md`, with these ➕ additions:
- `detect`: unchanged.
- `packs`: add `place: [{ channel, reason }]` (ranked) and, for homemade, `availability`.
- `price`: `comps?[]` only holds links that actually returned a ₹ figure (see C5).

## 6. Photo honesty rule (non-negotiable, both docs agree)
✅ Enhance, never alter the item. No product regeneration. Always keep one original. BechDe's own cut list also says "Background swap only, no product regeneration. Non-negotiable."

## 7. Channels (✅ decided, C4)
| Channel | What we produce | How it goes out today | Priority |
|---|---|---|---|
| **WhatsApp** | Message with price + how to order; poster/menu card (homemade); 9:16 Status image | One tap via the share sheet (photos + text) or `wa.me/?text=`. The UI is built around **who** they send it to: family group · society/apartment group · friends group · Status. Message tone fits the audience (the society group gets a short, polite one). | P0 |
| **Instagram** | Feed post (4:5, carousel if 2+ photos) · Story (9:16) · Reel cover / Pro video · caption + hashtags | One tap per format via the share sheet. Caption is auto-copied first because Instagram drops shared text. Show a short "how to post this as a carousel / story" hint for each format. | P0 |
| **OLX** | Every field OLX asks for, in OLX's order, plus photos sized for it | **Guided copy-paste:** a step-by-step screen that follows OLX's real posting flow (category → details → title → description → price → photos → location). Each step has the exact value and a Copy button. "Open OLX" button. | P0 (the "pakka UX" moment) |
| **FB Marketplace** | Same idea, Marketplace's fields and order | Same guided copy-paste flow | P0 after OLX (it reuses the same component) |
| **Sell It listing page** | Gallery, details, trust checklist, FAQ | Public link `/l/<slug>` with a WhatsApp contact button. It's the link we share everywhere. | P0 |
| Cashify, Etsy, kabadiwala etc. | Text suggestion from Place | none | P2 |

**Before building the guided flows:** one person walks through the **actual current OLX and Marketplace posting flows on a phone**,
screenshots every step and writes down the field order. That's manual research, not scraping, and the guide gets built from it.
Fields vary by OLX category (e.g. mobiles vs furniture), so do the top 3 categories we expect: phones/electronics, furniture, other.

## 8. Languages
❓ C6. Handoff: English + Hinglish, Hindi/Kannada P1. BechDe: English + Hindi, Marathi/Tamil stretch.

## 9. Money
✅ **Everything in §4 steps 1–8 is free** for anyone who signs up. **Pro = product video** (C11).
✅ **Payments: Pine Labs Online Payment Links API** (title sponsor, and a judge is from Pine Labs). The free developer
account gives instant **UAT (test) keys** under Dashboard → Settings → API Keys. Server creates a link, and a webhook/callback unlocks Pro.
The client secret stays server-side.
- ⚠️ UAT payments are test money. If "5 paid users" turns out to be a real requirement (§13), we need production
  keys, which means merchant onboarding/KYC. Ask the Pine Labs people at the venue right away; they may be able to fast-track it.
- Docs: https://www.pinelabs.com/docs/online-payments/quick-start-guide ·
  https://www.pinelabs.com/docs/online-payments/payment-links/create-via-apis
- Pitch extras worth a look (P2): Pine Labs **UPI Reserve Pay** (matches our "reserve this item" idea) and the
  **Pine Labs Payment Protocol** for AI agents (matches the keynote theme, "agent ecosystem").
- Price point for Pro: TBD (BechDe suggested ₹49 per item or ₹99/month).

## 10. Stack
✅ **Decided:** Next.js (App Router) + TS + Tailwind + shadcn/ui on **Render** · **Supabase** (Postgres + Storage for images + Auth) ·
Claude Sonnet 5.5 for vision, questions, price and copy (structured JSON) · segmentation for photos (C3) · web search for comps ·
ElevenLabs STT (P1) · Pine Labs payment links.
**Sign-up:** Supabase Auth with **Google sign-in** (one tap on Android), plus name + WhatsApp number on the profile.
Don't rely on Supabase's built-in email sender for magic links: it's heavily rate-limited unless we add our own SMTP. No SMS OTP.

What each source doc proposed, for reference:
| | Handoff | BechDe |
|---|---|---|
| App | Next.js (App Router) + TS + Tailwind + shadcn/ui, PWA | Next.js 14 |
| Hosting | **Render** (credits + Render prize) | Vercel |
| DB/storage | Render Postgres + object storage, or Supabase | Supabase |
| Identity | Name + WhatsApp/email, no password | Phone OTP via MSG91 |
| Vision/copy LLM | Claude Sonnet 5.5, structured JSON | GPT-4o or Claude 3.7 Sonnet |
| Images | Segmentation (e.g. `@imgly/background-removal`) + canvas/sharp | Gemini 2.5 Flash Image (Nano Banana) |
| Price comps | LLM provider's web search (P1) | Serper.dev + seeded comparables table |
| Voice | ElevenLabs Scribe (P1) | none |
| Payments | `upi://pay` link (P1), Pine Labs as P2 | Razorpay Payment Links |

## 11. Traction (both agree on the core)
✅ 20 real users who finish a listing and leave feedback; `/stats` page shown at the table; soft launch to friends, then society WhatsApp groups, family groups, college/cousins, move-out groups, people in the hall, X/LinkedIn, Instagram story.
✅ **No made-up numbers.** BechDe's pitch script contains placeholder figures (₹42,000 room, 40 orders/month, "32 users, 7 paid, ₹18,420", the 61-year-old user, ₹12,000 Cr market). Swap them for live `/stats` numbers, real user stories and one sourced market stat before anyone says them on stage.

## 12. Conflicts to decide
| # | Topic | Handoff | BechDe | Recommendation (not decided) |
|---|---|---|---|---|
| ~~C1~~ | Name | ✅ **Sell It** | | |
| ~~C2~~ | Paywall / payments | ✅ Free for signed-up users; Pro = product video; Pine Labs payment links (§9) | | |
| **C3** | Photo tool | Segmentation, no generative editing | Nano Banana background replace | Segmentation. A generative "background swap" can still redraw the product, which breaks the honesty rule in CLAUDE.md. |
| ~~C4~~ | Channel scope | ✅ All channels; WhatsApp/Instagram one-tap; OLX/Marketplace guided copy-paste; direct posting later (§7) | | |
| ~~C5~~ | Price citations | ✅ **Comps in P0** (§4 step 5). Still applies: no seeded table unless every row is a real, sourced listing. "Nearby society groups" can't be sourced. | | |
| **C6** | Languages | En + Hinglish; Hindi/Kannada P1 | En + Hindi; Marathi/Tamil stretch | P0: En + Hinglish + Hindi (it's only LLM output). P1: Kannada (we're in Bengaluru) ahead of Marathi. The BechDe demo script has a Marathi caption, so change it. |
| ~~C7~~ | Stack | ✅ **Render + Supabase** (§10) | | |
| **C8** | Stage demo | Judge's phone live + Hinglish voice note → share live → QR → `/stats` | Three prepared items (laptop, crochet, dosa batter) + live ₹49 payment | Open with BechDe's story hook (hesitation), demo the judge's device live (proves it's real), switch to one prepared homemade item to show availability + poster, close on `/stats`. |
| **C9** | Timeline | Submit ~17:00, Round 1 17:15, stage 19:00 | 09:00 start, deck/video 17:30–18:30, 19:30 finish | Use the handoff (it matches the day-of slide). BechDe's hour plan was written before kickoff and is now stale. |
| **C10** | Competitor facts | OLX India: no photo-to-listing feature found | "OLX has AI listing writing"; adds Dukaan, QuickSell | Spend 5 minutes checking the OLX claim before it goes in the pitch. Add Dukaan + QuickSell to `03-competitors.md`. |
| **C11** | Pro video: how it's made (new) | n/a | n/a | **Build it from the real, cleaned photos**: pan/zoom across them, captions (title, price, key details, how to order) and an optional **ElevenLabs TTS voiceover** in the listing language. Render to 9:16 MP4 with ffmpeg on the server. A good fit for a **Render Workflow** job, which also qualifies us for the Render prize. **No generative video of the product** (honesty rule). It's P1: ship it only after the free P0 slice is live with users. |
| ~~C12~~ ✅ | Who it's for (new) | Anyone selling anything: pre-owned, new, homemade. Pre-owned has the strongest trust story; your OLX pitch is pre-owned-led. | Product description: "marketing team for every **home business**" (dosa batter, crochet, pickles). No mention of old stuff. | **One product, homemade-led story.** Pitch and landing copy lead with home businesses (that's the description, and the fastest users in society groups). Pre-owned and new stay in the product and get one line in the pitch ("…and it works for your old laptop too"), because the OLX guided flow is our best UX moment and OLX is mostly pre-owned. |
| ~~C13~~ ✅ | "4 Ps" wording (new) | n/a | BechDe pitch: don't say "4 Ps" on stage, it sounds academic. Product description says "all 4 Ps of marketing" outright. | Keep it in the one-liner and the submission text, where it reads well. On stage and in the app UI, use the plain words: what to call it, what to charge, what to show, where to post. |

## 13. Confirm with organisers (one person, now)
1. Exact submission time (~17:00?) and whether a video is required.
2. Is "5 paid users" part of any prize gate? (Decides C2.)
3. Deadline for the 20 users: 17:00 (Round 1) or 19:30?

## 14. Build order from now (once C1–C7 are locked)
| When | What |
|---|---|
| now–13:20 | Repo scaffold, live URL on Render, Supabase project + Google sign-in, JSON schemas in code. In parallel: Pine Labs UAT signup |
| 13:20–14:45 | P0 slice: sign-up → upload → detect → questions → studio → price + comps → packs (+ Place) → ZIP/share → listing page → feedback + `/stats` |
| 14:45–15:00 | Soft launch to 5–10 friends, fix breakages |
| 15:00–16:30 | User push · P1 (Pro video + Pine Labs payment, voice input, Kannada, availability polish) |
| 16:30–17:00 | Submission video, replace pitch numbers with real `/stats`, submit |

Team split as in `handoff/05-build-plan.md` (A: frontend/UX · B: AI + prompts + STT · C: images, infra, listing page, `/stats`, user push from 15:00).
