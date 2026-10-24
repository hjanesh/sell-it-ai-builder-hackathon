# Sellit

> **Source doc (teammate pitch v2), kept as-is.** Reviewed and merged into `docs/SPEC.md` (see the "Pitch v2 reviewed" note at its top), which wins wherever the two differ.

*Your home business's marketing team. One photo in. First listing live in 60 seconds.*

**Event:** Airtribe AI Builders Day — Bengaluru, 24 Oct 2026
**Track:** Commerce (title sponsor: Pine Labs)
**Prize gate:** 20 live users + 5 paid + working product by 19:30

---

## 📌 What's new in v2.0

If you read v1.0, here's what changed:

| Area | v1.0 | v2.0 |
|---|---|---|
| **Positioning** | A listing kit (write ad + post it) | A marketing team (9 marketing roles in one app) |
| **Pricing** | Only grounded citations from OLX/Marketplace | Grounded for resale + **algorithmic pricing engine** for handmade/food (cost basis + anchor + strategy) |
| **Social proof** | "5 live listings cited" | *"73% of similar listings this month priced ₹500-₹850"* — fed by our own seed data |
| **Channel output** | One generic kit per listing | **4 channel-specific builders** (WhatsApp Status / WhatsApp Post / Instagram Reel / Facebook Marketplace) — each a different format |
| **Monetization lock** | ₹49 unlocks everything | ₹49 unlocks static kit; **Reels locked behind paywall** |
| **Payment** | Razorpay Payment Links | **Personal UPI QR** — simpler, no KYC drama, works today |
| **Login** | Not specified | **Phone OTP via Firebase** — minimal friction |
| **Order management** | None | **Interest capture + buyer list + 1-tap WhatsApp outreach** |
| **Repeat sales** | None | **Retargeting flow** — notify past interested buyers on new drops |
| **UI principle** | Not stated | **"Clean, calm, mobile-first"** — explicit design brief |

---

## 1. The problem

Millions of Indian homes have something to sell.

Sometimes it's **old stuff** — the laptop replaced two phones ago, the pram the baby outgrew in four months, silk sarees unworn for a decade.

Sometimes it's **something made at home** — dosa batter, brownies, crochet baskets, paintings, hand-poured candles, pickles, tiffin service.

**They almost never actually sell.** The stuff sits. The dosa batter mum posts once a month, badly, in the society WhatsApp group, and never scales.

Why? Because selling from home demands five hard decisions in a row, with no help:

- *What exactly am I selling?* (positioning)
- *What's it worth?* (pricing)
- *How do I show it off?* (photos, copy, video)
- *Where do I post it?* (channel)
- *How do I keep buyers coming back?* (retention)

Nothing on the market solves all five for someone who doesn't want to become a full-time seller. **The hesitation gap is the problem.**

---

## 2. How it's handled today

| What people do | Why it fails |
|---|---|
| Nothing. Stuff accumulates. | Guilt, inertia, no obvious first step |
| Shaky photo + one line on society WhatsApp | Low price, no scale, dies in a day |
| Quick OLX listing | Lowballed within hours — the price is a guess |
| Hand to shopkeeper / scrap dealer / maid | Loses 80% of value |
| Starts an Instagram page for her brownies | Dies after 3 posts — too much work for occasional business |
| Uses Canva + ChatGPT + OLX separately | Four tools, three logins, two hours — most quit halfway |

**Nothing bundles the full first-listing journey for a home seller.** And nobody rebooks the buyer when the seller comes back next week.

---

## 3. Sellit — the home seller's marketing team

**One product. One persona.** Anyone with something to sell from home — whether that's an old guitar or fresh ladoos. We ask one question: *"What are you selling?"*

**Our promise:** your first listing live, in your language, with a fair price and good photos, on the right platform — in 60 seconds. Plus: we keep your buyer list and bring them back when you list again.

**Explicitly not:** a 24/7 shop. Every listing can be marked *Weekly batches*, *By request*, or *One-off* — so a mum selling dosa batter on Tuesdays isn't buried under daily DMs.

### Why this isn't just another listing tool

Sellit is nine marketing roles in one app:

| Marketing role | What Sellit does |
|---|---|
| 🎯 Brand strategist | Writes a 1-line positioning hook |
| 💰 Pricing analyst | 3-strategy algorithm with social proof |
| 📸 Photographer | Studio-grade background swap |
| ✍️ Copywriter | Multilingual, channel-tuned copy |
| 🎥 Video editor | 15s Reel (paywall-gated) |
| 📍 Media planner | Picks the right channel for *this* item |
| 📇 CRM manager | Captures interested buyers' details |
| 🔁 Retargeter | Notifies past buyers on new drops |
| 📊 Analyst | Views + interest counts per listing |

**That's the pitch:** *₹49 for your first listing. ₹99/month to keep your marketing team.*

---

## 4. The app — section by section

The app has 8 clean screens. Each does one thing well. No clutter, no modals-on-modals.

### 4.1 Welcome / Login
- Phone number + OTP (Firebase phone auth or MSG91)
- One screen, one input, one button
- No email, no password, no "sign in with Google" clutter
- Returning users auto-skip after OTP once per device

### 4.2 Snap
- Big camera / upload button (nothing else on screen)
- Optional: "What are you selling?" one-line text field (helps vision model)
- Progress spinner while uploading

### 4.3 Identify
- AI shows: *"This looks like a [HP Pavilion 15 laptop]. Right?"*
- Yes / No / Fix buttons
- If "Fix" → short free-text correction
- If more specs needed: *"Can you share the About screen?"* → second upload

### 4.4 Price
Shows 3 cards, user picks one:

```
💨 Sell Fast     ₹449
   33% margin · moves in 2 days

⭐ Optimal       ₹649     [recommended]
   65% margin · balanced

💎 Signature    ₹899
   115% margin · limited batches
```

Below: cost breakdown + social proof line.

### 4.5 Marketing Kit (🔒 paywall)
Preview visible — 1 photo + 1 caption teaser. Full kit locked behind ₹49.

Payment: **Our personal UPI QR displayed on screen.** User scans, pays ₹49, taps "I paid." Honor system + spot-check post-event. Zero KYC friction.

Once unlocked:
- 3 studio-restaged photos (carousel)
- Copy variants per language (English, Hindi)
- Availability toggle: *Weekly batches / By request / One-off*
- Buttons for 4 channels (next screen)

### 4.6 Channels
4 cards. Tap one to generate the channel-specific asset:

| Channel | Format | Preview |
|---|---|---|
| 📱 WhatsApp Status | 9:16 image + 2-line caption | Rendered on screen |
| 💬 WhatsApp Group | 1:1 image + 4-line caption + link | Rendered on screen |
| 🎥 Instagram Reel | 15s vertical video (🔒 extra paywall) | Teaser frame |
| 🛒 Facebook Marketplace | Title + long description + category | Fields prefilled |

### 4.7 Share
Platform-specific asset + "Share now" button.

- WhatsApp: `wa.me` deep link with image preview via public URL OG tag
- Instagram: image downloads, caption copies to clipboard, deep link opens Instagram
- Marketplace: deep link + clipboard fallback for fields that don't prefill

Every listing gets a public page: `sellit.app/l/[slug]`. **This is our actual distribution channel.**

### 4.8 Dashboard
Seller's home base after first listing.

- All your listings in a grid (photo + status)
- Each tile: views count, interested-buyers count
- Tap in → listing detail with:
  - **Buyer list** (name, WhatsApp, qty, time)
  - Per-buyer "Message on WhatsApp" button (prefilled)
  - Group action: **"Message all interested buyers"**
  - **Retarget banner** when seller republishes: *"11 past buyers were interested. Notify them of this new batch?"* → one-tap WhatsApp sequence

---

## 5. UI design brief — clean, calm, mobile-first

The app is used by moms in kitchens and uncles in living rooms. **The UI must respect their time and attention.** Non-negotiables:

### Design principles
- **One primary action per screen.** No crowded CTAs.
- **Mobile-first, fat-finger targets (min 48px tap area).**
- **High contrast, large type.** Base font 16px, headings 24-28px.
- **Loading states always present** — never a blank screen during AI calls.
- **No modal within modal.** No nested bottom sheets.
- **Hindi + English toggle in header,** persistent.
- **Zero marketing fluff on primary screens.** No "unlock the power of…" — just the next action.

### Visual language
- **Palette:** warm neutral background (#FAF8F3), one accent color (deep teal or terracotta — pick tonight), black text at 90% opacity, muted secondary text at 60%
- **Typography:** Inter or Noto Sans (Noto handles Devanagari + Tamil cleanly)
- **Spacing:** generous — 24px between major blocks, 16px within blocks
- **Corners:** 12px radius everywhere; no sharp edges
- **Icons:** Lucide or Phosphor only; no mixed sets

### What good looks like
Think: Groww's clarity, Google's calm, Khatabook's practicality. **Avoid:** Dukaan's density, OLX's chrome, generic shadcn-with-no-opinion.

### Build note
Default shadcn/ui + Tailwind, but override the color palette and radius in `globals.css` tonight. If we leave defaults, we look like every other hackathon demo. One hour of theming makes us look shipped.

---

## 6. The pricing engine (the moat for handmade/food)

Grounded citations work for resale. They fail for handmade — there's no OLX for crochet. For handmade/food we use a **real pricing algorithm**:

```
Inputs:
- category         (crochet, candles, paintings, food, art…)
- materials_cost   (user input, or AI estimate)
- time_hours       (user input)
- quality_tier     (AI-picked from photo: basic / standard / premium)
- audience         (local / regional / aspirational)
- goal             (sell_fast / optimal / signature)

Constants (seeded tonight per category):
- hourly_rate_default = ₹150
- overhead_pct        = 20% of materials
- min_margin          = 30%
- category_median[]   = seeded from 500 Instagram handles

Floor (never below):
cost_basis = materials + (time × 150) + (materials × 0.2)
floor      = cost_basis × 1.30

Ceiling (what market pays):
anchor     = category_median[category] × quality_multiplier[tier]
ceiling    = anchor × 1.5

3 options:
- sell_fast  = floor, rounded psychologically
- optimal    = avg(floor, anchor), rounded
- signature  = ceiling, rounded

Rounding:
- <₹500        → end in 9 (₹449)
- ₹500–5000    → end in 99 (₹599)
- >₹5000       → nearest 100
```

### Social proof string
```
"73% of {category} sellers on Sellit this month 
 priced between ₹{p25}-₹{p75}."
```

Seed p25/p75 from a 500-listing scrape done tonight across 10 categories. As real listings come in, replace seed with live data.

### For food (dosa batter, etc.)
```
price = ingredient_cost × 2.75 (home-food standard)
      + delivery_radius_markup
      + premium_flags (organic, pure-veg, no-preservatives)
```

Seed data: ask 2 friends tonight for screenshots of their society-group food prices. 30 examples = enough to anchor.

---

## 7. The 90-second pitch

**Hook (15s)** — *hold up phone with cluttered guestroom photo*
> "Priya makes the best dosa batter in Bengaluru. She sold 11 litres last month to her society. In the next apartment, Rohan has ₹42,000 of unused electronics he's never listed. Both have the same problem: they're entrepreneurs with no marketing team."

**Demo (40s) — one flow, three items**
1. Snap old laptop → identifies → 3 pricing options with real OLX citations → recommends OLX + Cashify.
2. Switch to crochet basket → identifies handmade → pricing algorithm shows ₹449/₹649/₹899 with *"73% priced ₹500-₹850"* social proof → recommends Instagram + local FB group.
3. Switch to dosa batter → intake form (1L, Koramangala, pure-veg) → algorithm says ₹120 → Marathi caption → *Weekly batches: order by Thursday* → society WhatsApp.

**The CRM reveal (15s)**
> "Here's what no one else does." *Open dashboard.* "Last week Priya listed dosa batter. 11 people tapped 'interested.' This week, new batch, one tap —" *shows WhatsApp sequence firing* "— 11 messages go out, personalized. That's retention."

**Pay live + traction (10s)**
> *Shows UPI QR, user pays ₹49.* "32 users, 7 paid, ₹18,420 of inventory listed, 11 interested buyers retargeted. In 11 hours."

**Market + ask (10s)**
> "₹49 for your first listing. ₹99/month to keep your marketing team. Nine marketing roles for ₹99. The commerce layer above UPI. Pine Labs is payments. We're the brand team for every home."

---

## 8. Honest critique — what could kill this

### Real risks (ranked)

1. **AI image slop on stage.** One bad studio shot = demo dead.
   **Fix:** background swap + relight only, never regenerate product. Auto-grade with GPT-4o before showing. Fallback to upscale + white background.

2. **Grounded pricing citations click to dead URLs.**
   **Fix:** server-side fetch each cited URL before display; only show links that 200 and still contain `₹`.

3. **Nobody pays ₹49 for an untried app.**
   **Fix:** show first photo + first caption *before* paywall. Teaser → paywall → full kit. Converts 10x.

4. **WhatsApp retargeting hits spam limits.**
   **Fix:** use `wa.me/<phone>` deep links in a queue (not WhatsApp Business API). User's own device sends each message. Zero spam flags.

5. **Dead OLX citations for less common items.**
   **Fix:** fall back to Cashify (electronics) + Amazon used + a pre-seeded corpus of 500 common items.

6. **Reel generation blocks demo.**
   **Fix:** paywall it + pre-render demo examples. If Shotstack API slow on stage, show pre-rendered example.

7. **Judges call it "a wrapper."**
   **Fix:** rehearsed 15-sec response: *"Three things no wrapper does — real pricing with citations, Indian-language channel-specific output, and a buyer-retargeting CRM that remembers who was interested last time."*

### Scope cuts if behind by 15:00

| Cut | Save | Cost |
|---|---|---|
| Drop Reel generation; show mock only | 2h | Weaker Creator-track story |
| Ship 1 language (English only) | 1h | Weaker India wedge |
| Drop Marketplace deep link, keep WhatsApp + public page only | 1h | Narrower channel story |
| Drop retargeting from MVP, show mocked | 2h | **Lose the moat moment — don't cut this** |

**Non-negotiable to ship:** interest capture + retargeting demo. That's the pitch's turning point.

---

## 9. Build plan

### Stack
- **App:** Next.js 14, Vercel
- **Auth:** Firebase phone OTP (free tier covers today)
- **DB + Storage:** Supabase (Postgres + Storage)
- **Vision:** GPT-4o
- **Grounding (resale):** Serper.dev + a seeded corpus for fallback
- **Pricing (handmade/food):** our own algorithm + seeded category medians
- **Studio images:** Gemini 2.5 Flash Image (Nano Banana) — background swap only
- **Copy:** Claude 3.7 Sonnet (multilingual, channel-tuned prompts)
- **Reel:** Shotstack API ($20 budget)
- **Payment:** Personal UPI QR (static image on paywall) + honor-system "I paid" button
- **Share:** `wa.me` deep links + public listing page with OG tags

### Hour-by-hour

| Time | Work | Owner |
|---|---|---|
| 09:00–09:30 | Kickoff. Lock scope, name, QR, team roles. | All |
| 09:30–11:00 | Scaffold Next.js + Supabase + Firebase phone OTP. | Dev 1 |
| 11:00–12:30 | Vision pipeline + confirm/fix UX. | Dev 1 |
| 11:00–13:00 | Grounded pricing (Serper + extraction + citation render). | Dev 2 |
| 11:00–13:00 | Handmade pricing algorithm + seeded category table. | Dev 3 |
| 13:00–14:00 | Paywall screen with UPI QR + "I paid" unlock. | Dev 1 |
| 13:00–15:00 | Studio pack (Nano Banana + Claude channel-specific copy matrix). | Dev 2 |
| 15:00–16:00 | Public listing page `/l/[slug]` + interest capture form. | Dev 1 |
| 15:00–16:30 | Dashboard + buyer list + WhatsApp sequence. | Dev 3 |
| 16:00–17:00 | Channel-specific post builder (4 formats). | Dev 2 |
| 17:00–17:30 | Retargeting flow + demo seed data. | All |
| 17:30–18:30 | UI polish pass (theming, spacing, loading states). | Dev 2 |
| 17:30–18:30 | Pitch deck + 60s demo video (shot inside Sellit — meta). | Dev 3 |
| 17:30–19:30 | **Distribution + payment chase.** | All |

### Pre-event tonight checklist
- [ ] Register `sellit.app` or similar
- [ ] Firebase project + phone OTP enabled
- [ ] Supabase project + schema
- [ ] Serper.dev account + API key ($25 top-up)
- [ ] Gemini / Claude / OpenAI API keys with budget alerts
- [ ] Shotstack account (if Reel included)
- [ ] **Our personal UPI QR exported as PNG** (clean, high-contrast)
- [ ] Overnight: seed 500-listing corpus for 10 categories
- [ ] Overnight: ask 2 friends for society-group food price screenshots
- [ ] Line up 3 primed paying users for 13:00–15:00
- [ ] 10 soft yeses for free trial users

---

## 10. Go-to-market

### Day-of
| Time | Channel | Hook |
|---|---|---|
| 11:30 | Family WhatsApp | *"Mum, snap your old saree — I'll tell you what it's worth and write the listing."* |
| 13:00 | Society group | *"Dosa batter / brownie / crochet sellers — AI writes your first ad in Hindi + Marathi."* |
| 14:30 | College + cousins | *"Yaar, old laptop/phone pada hai? Try this."* |
| 16:00 | X + LinkedIn | Before/after thread with real listing |
| 17:30 | Instagram story | 15s demo clip |

**Target:** 20 users by 17:00, 5 paid by 18:30.

### Getting the 5 payments
1. 2 primed friends who pay in the first hour (test the funnel)
2. Society WhatsApp drop at 13:00 → ~3 organic payers
3. "Pay what you want from ₹10" hidden fallback for the last-mile user

---

## 11. Open decisions (lock by 09:00)

1. **Name final:** Sellit / Listit / Thelo — pick one tonight, buy domain
2. **Accent color:** deep teal (#1A6B6B) or terracotta (#C45A3A)?
3. **Reel in MVP** or paywall-only teaser with pre-rendered example?
4. **First 5 paying users:** who are they? Reaching out tonight?
5. **Personal UPI QR owner:** whose VPA? Keep screenshot archive for audit.
6. **Third language:** Marathi or Tamil (if time)?
7. **Who demos on stage?** Pick storyteller. Rehearse once at 18:00.

---

## 12. North Star metric for the day

> **5 paid users by 19:30, each with a listing shared on a real channel, each with at least 1 interested buyer captured.**

Not downloads. Not signups. Not demo views. **Paid listings + captured demand.** That's product-market fit in 12 hours — and that's what wins ₹1L and the Peer Capital meeting.

---

*Document owner: [you]. Last updated: 24 Oct 2026, pre-kickoff. v2.0.*
