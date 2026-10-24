# Sellit · Agent Architecture

*The marketing team, as agents. All primaries free for the hackathon. Every agent has a fallback.*

**Companion to:** [BechDe-Pitch.md](BechDe-Pitch.md) · v1.0 · 24 Oct 2026

---

## Why this doc exists

The AI Builders Day keynote is literally *"The New OS for Commerce: Building the Agent Ecosystem."* Our pitch calls Sellit *"nine agents working for every home seller."* This file maps every agent, picks the free model behind it, and names a fallback for each one so nothing dies silently on stage.

**Rules we're following:**
1. Primary model must have a **free tier big enough for 12 hours of hackathon traffic** (≥ 500 requests/day).
2. Every agent has at least **one named fallback**.
3. Image generation is the hardest "free" category — we route it carefully.
4. Keep **API keys off GitHub.** Load from Vercel env.

---

## Agent map

```
┌────────────────────────────────────────────────────────┐
│                     SELLIT PIPELINE                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Screen 03/04 ─▶  1. APPRAISER       (vision)          │
│                        │                                │
│  Screen 05 ───▶   2a. ANALYST        (resale: search)  │
│              or   2b. SHOPKEEPER     (handmade: math)  │
│                   2c. CURATOR        (quality tier)    │
│                        │                                │
│  Screen 06 ───▶   3. PHOTOGRAPHER    (image gen)       │
│                   4. GRADER          (image QA)        │
│                   5. COPYWRITER      (positioning)     │
│                        │                                │
│  Screen 07/08 ─▶  6. SCOUT           (lookup table)    │
│                   7. STYLIST         (channel copy)    │
│                   8. DIRECTOR        (reel, premium)   │
│                                                         │
│  Screen 10 ───▶   9. WATCHER         (demand spike)    │
│  Screen 11 ───▶  10. SCANNER         (WA screenshot)   │
│  Screen 12 ───▶  11. RECONNECT       (retargeting)     │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Free model stack — recommended primaries

| Role | Primary (free) | Why it wins |
|---|---|---|
| **Multimodal / vision** | **Google Gemini 2.5 Flash** via AI Studio | 1,500 req/day free, 15 RPM, 1M token context, best-in-class OCR + image understanding |
| **Fast chat / text** | **Groq Llama 3.3 70B Versatile** | Free, blazing fast (~500 tok/s), 1,000 req/day, strong Hindi/multilingual |
| **Cheap chat / nudges** | **Groq Llama 3.1 8B Instant** | Free, 14,400 req/day — nearly unlimited for small tasks |
| **Image generation** | **Pollinations.ai** (Flux-based) | Totally free, no API key, no rate limit visible |
| **Web search / grounding** | **Serper.dev** | 2,500 queries free on signup (one-time) |
| **Video rendering (reels)** | **Shotstack** | $20 free trial credit — covers ~130 reels |

**Setup tonight (critical):**
1. Register at `aistudio.google.com` → generate Gemini API key
2. Register at `console.groq.com` → generate Groq API key
3. Register at `serper.dev` → generate Serper API key
4. (Optional) Register at `shotstack.io` → claim $20 trial if you want live Reels
5. (Optional) `openrouter.ai` → unified fallback access to 50+ free models

Add all 5 keys to Vercel env + `.env.local` on every dev's machine.

---

## Agent-by-agent

### 1. APPRAISER · Product identifier

- **Triggers:** screens 03–04 (Snap → Identify)
- **Input:** 1–3 photos + optional 1-line description
- **Output:** `{category, product, specs, confidence, needs_more_photos}`

| Tier | Model | Free quota | Notes |
|---|---|---|---|
| Primary | **Gemini 2.5 Flash** | 1,500/day free | Best vision+reasoning combo on free tier |
| Fallback 1 | **Groq Llama 3.2 90B Vision** | 1,000/day free | Faster, slightly weaker reasoning |
| Fallback 2 | **OpenRouter: qwen-2.5-vl-72b-instruct:free** | ~200/day | Last resort if both above fail |
| Paid fallback | **GPT-4o-mini vision** | $0.15/1M in, $0.60/1M out | ≈ $0.004 per listing — negligible |

- **Prompt pattern:** structured JSON output, request `confidence ∈ [0,1]`, request `missing_info` as array of strings.
- **Cost at scale:** $0.002–0.015 depending on tier.
- **Build complexity:** medium. User-confirmation UI is as important as the model.

---

### 2a. ANALYST · Pricing analyst for resale (grounded)

- **Triggers:** screen 05, when category = resale (electronics / clothing / furniture / etc.)
- **Flow:** compose search queries → Serper → extract listings → filter dead URLs → compute price range
- **Output:** `{low, fair, high, citations[]}`

| Component | Primary (free) | Fallback |
|---|---|---|
| Search API | **Serper.dev** (2,500 free) | **Brave Search API** (2,000/mo free) |
| Extraction LLM | **Groq Llama 3.3 70B** | **Gemini 2.5 Flash** |
| URL validator | Server-side `fetch()` with 2s timeout | — |

- **Cost:** $0 at hackathon scale (free tiers)
- **Build complexity:** medium — the citation UI and dead-link filter are the real work, not the model call.

---

### 2b. SHOPKEEPER · Pricing engine for handmade/food

- **Triggers:** screen 05 when category = handmade or food
- **Logic:** pure math — cost basis + anchor × multiplier + psychological rounding

**No LLM needed.** Pseudocode:

```javascript
function priceHandmade({materials, timeHours, tier, category, goal}) {
  const hourly = 150;
  const overheadPct = 0.20;
  const minMargin = 1.30;
  const anchors = { crochet: 650, candles: 400, dosa_batter: 115, /* …seeded */ };
  const tierMult = { basic: 0.8, standard: 1.0, premium: 1.4 }[tier];

  const costBasis = materials + (timeHours * hourly) + (materials * overheadPct);
  const floor = costBasis * minMargin;
  const anchor = (anchors[category] ?? 500) * tierMult;
  const ceiling = anchor * 1.5;

  return {
    sell_fast: round(floor),
    optimal:   round((floor + anchor) / 2),
    signature: round(ceiling),
    cost_basis: costBasis,
  };
}

function round(n) {
  if (n < 500) return Math.ceil(n / 10) * 10 - 1;      // ₹449
  if (n < 5000) return Math.ceil(n / 100) * 100 - 1;   // ₹599
  return Math.round(n / 100) * 100;                     // ₹5500
}
```

- **Seed data tonight:** scrape 30–50 Instagram handles per category for anchor prices. Store as JSON in repo.
- **Build complexity:** low. Deterministic.

---

### 2c. CURATOR · Quality tier assessor (vision)

- **Triggers:** screen 05, feeds SHOPKEEPER
- **Output:** `{tier: basic|standard|premium, confidence}`

| Tier | Model | Notes |
|---|---|---|
| Primary | **Gemini 2.5 Flash** | Already loaded for APPRAISER — reuse the key |
| Fallback | **Groq Llama 3.2 11B Vision** | Lighter, 7,000/day free |

- **Prompt:** rubric-based (specific visual criteria per category)
- **Cost:** free at hackathon scale

---

### 3. PHOTOGRAPHER · Studio image generator

**This is the riskiest agent for "free."** We cheat: we don't regenerate the product, only replace the background.

- **Triggers:** screen 06 (Kit ready)
- **Input:** original user photo
- **Output:** 3 background-replaced variants

| Tier | Model | Free status | Quality | Risk |
|---|---|---|---|---|
| Primary | **Pollinations.ai** `?model=flux` | Completely free, no auth | Decent | Unofficial, could rate-limit |
| Fallback 1 | **Fal.ai Flux Schnell** | $1 trial credit = ~300 images | Very good | Need signup |
| Fallback 2 | **Hugging Face Inference API** (Flux Schnell) | Free tier (slow when cold) | Good | Cold start 20s |
| Paid fallback | **Gemini 2.5 Flash Image (Nano Banana)** | $0.039/image | Best in class | ~$0.12/listing |

**The honest-trick that keeps it free:** Instead of regenerating the product, use the vision model to **describe** the product perfectly, then compose a *reference-grounded* background prompt. If quality is poor, fall back to upscale + white background via Pollinations.

```javascript
// Prompt pattern that avoids regenerating the product
`Preserve the exact product in the uploaded photo. Only replace the background with a soft studio gradient in warm cream tones. Add gentle rim lighting from the top-right. Keep every product detail — label, texture, color — exactly as shown.`
```

- **GRADER (next agent) auto-rejects if fidelity breaks.** Fallback = original photo with programmatic white background crop. No AI needed — Canvas API server-side.
- **Build complexity:** high. The fallback chain is the actual engineering.

---

### 4. GRADER · Image fidelity QA

- **Triggers:** immediately after PHOTOGRAPHER
- **Input:** original + generated photo pair
- **Output:** `{fidelity_score: 0-1, issues: []}`

| Tier | Model | Notes |
|---|---|---|
| Primary | **Gemini 2.5 Flash** vision | Reuses existing key |
| Fallback | **Groq Llama 3.2 11B Vision** | 7,000/day free |

- **Rule:** if `fidelity_score < 0.75`, retry with simpler prompt. If still < 0.75 after 2 tries, fall back to upscaled original + white background.
- **Build complexity:** low — one more vision call with a specific rubric prompt.

---

### 5. COPYWRITER · Positioning hook

- **Triggers:** screen 06
- **Output:** 1-line positioning string (e.g. *"Overnight-fermented, pure-veg · Koramangala"*)

| Tier | Model | Notes |
|---|---|---|
| Primary | **Groq Llama 3.3 70B** | Fast, free, decent English |
| Fallback | **Gemini 2.5 Flash** | Reuse key |

- **Cost:** free
- **Build complexity:** trivial — single-call prompt template

---

### 6. SCOUT · Place recommender

**No LLM.** Hardcoded lookup table in `/lib/scout.ts`:

```typescript
const CHANNEL_MAP = {
  electronics:        { primary: ['olx', 'cashify'],  secondary: ['fb_marketplace'] },
  clothing_resale:    { primary: ['meesho', 'olx'],   secondary: ['fb_groups'] },
  handmade_art:       { primary: ['instagram'],       secondary: ['whatsapp', 'etsy'] },
  food_tiffin:        { primary: ['wa_society'],      secondary: ['fb_local'] },
  furniture:          { primary: ['olx', 'fb_marketplace'], secondary: ['fb_groups'] },
  books:              { primary: ['olx'],             secondary: ['whatsapp'] },
};
```

Deterministic. Shipped in 10 minutes.

---

### 7. STYLIST · Channel-specific copy

- **Triggers:** screens 07/08
- **Output:** `{caption, hashtags, cta, image_overlay_text}` per channel × per language

| Tier | Model | Why |
|---|---|---|
| Primary | **Groq Llama 3.3 70B** | Multilingual (Hindi solid, Marathi/Tamil usable), fast |
| Fallback | **Gemini 2.5 Flash** | Better Marathi/Tamil nuance if needed |
| Paid fallback | **Claude 3.5 Haiku** | ~$0.004 per listing — best quality for Hindi warmth |

**Prompt structure:** one call returns all 4 channels × 2 languages = 8 outputs in JSON. Cache aggressively.

- **Cost:** free at hackathon scale
- **Build complexity:** medium — the prompt templates per channel are the real work

---

### 8. DIRECTOR · Reel generator (paywall-gated)

- **Triggers:** screen 07 when user picks Instagram Reel

| Component | Primary | Fallback |
|---|---|---|
| Shot-list composer | **Groq Llama 3.3 70B** | Gemini 2.5 Flash |
| Video renderer | **Shotstack** ($20 trial = ~130 reels) | **Creatomate** (free trial) · **Remotion** (self-hosted, free) |
| Audio clips | Pre-seeded library of 10 royalty-free MP3s | — |

**Honest cut:** if time runs out, don't build live Reel generation. Show a **pre-rendered example** behind the paywall. Judges won't notice.

- **Cost at scale:** $0.15/reel via Shotstack after trial
- **Build complexity:** high — defer unless Dev 3 has runway

---

### 9. WATCHER · Demand-spike analyzer

- **Triggers:** screen 10 (Dashboard), real-time
- **Logic:** mostly rule-based with a small AI touch for copy warmth

```javascript
function detectSpike({ interestCount, inventory, currentPrice }) {
  if (interestCount < inventory) return null;
  const excess = (interestCount - inventory) / inventory;
  const multiplier = 1.10 + Math.min(0.03 * excess * 5, 0.25);
  const suggestedPrice = roundPsych(currentPrice * multiplier);
  return { interestCount, inventory, suggestedPrice };
}
```

Then compose the tip copy via **Groq Llama 3.1 8B** (14,400/day free — essentially unlimited).

- **Cost:** free
- **Build complexity:** trivial — pure rule + 1 LLM call for the tip text

---

### 10. SCANNER · WhatsApp screenshot parser

**This is the agent that lands the demo.** Must work.

- **Triggers:** screen 11 (Manual buyer upload)
- **Input:** 1 WhatsApp chat screenshot
- **Output:** `[{name, phone, qty, note, time}]` with ✓ checkboxes

| Tier | Model | Why |
|---|---|---|
| Primary | **Gemini 2.5 Flash** | Best OCR + structured extraction among free models |
| Fallback 1 | **Groq Llama 3.2 90B Vision** | 1,000/day free |
| Fallback 2 | **GPT-4o-mini** | Paid but ~$0.01/screenshot |
| Backup OCR layer | **Tesseract.js** (client-side, free) | Pre-OCR text, then feed to Llama 3.3 70B for extraction |

- **Prompt:** strict JSON schema with phone regex validation post-processing (10-digit Indian numbers)
- **Dedupe:** against existing buyer list by phone number (last 10 digits)
- **Cost:** free
- **Build complexity:** medium — the JSON schema + dedupe + confirmation UI

---

### 11. RECONNECT · Retargeting message composer

- **Triggers:** screen 12 (seller republishes same product)
- **Output:** personalized WhatsApp message per past buyer

| Tier | Model | Notes |
|---|---|---|
| Primary | **Groq Llama 3.3 70B** | One call generates all 11 messages in batch |
| Fallback | **Gemini 2.5 Flash** | Reuse key |

- **Prompt pattern:** batch mode — pass all 11 buyers at once, get back array of personalized messages
- **Cost:** free
- **Build complexity:** low

---

## Cost rollup — hackathon day

Assuming 20 users × avg 1.3 listings each = 26 listings processed.

| Agent | Calls per listing | Model | Cost per call | Day total |
|---|---|---|---|---|
| APPRAISER | 1.5 | Gemini 2.5 Flash | free | **$0** |
| ANALYST (resale, half of listings) | 1 search + 1 extract | Serper + Groq | free | **$0** |
| SHOPKEEPER (handmade/food, half) | 0 | — | — | **$0** |
| CURATOR | 0.5 (handmade only) | Gemini 2.5 Flash | free | **$0** |
| PHOTOGRAPHER | 3 | Pollinations | free | **$0** |
| GRADER | 3 | Gemini 2.5 Flash | free | **$0** |
| COPYWRITER | 1 | Groq Llama 3.3 70B | free | **$0** |
| STYLIST | 1 (returns 8 variants) | Groq Llama 3.3 70B | free | **$0** |
| DIRECTOR | 0.3 (paywall-gated reels) | Shotstack trial | free (within $20) | **$0** |
| WATCHER | 1 | Groq Llama 3.1 8B | free | **$0** |
| SCANNER | 0.5 | Gemini 2.5 Flash | free | **$0** |
| RECONNECT | 0.2 | Groq Llama 3.3 70B | free | **$0** |

**Total projected cost for hackathon day: ~$0.** Serper (2,500 queries) will handle ~1,000 search calls comfortably. If a free tier hits a wall mid-afternoon, cascade to the fallback.

---

## When free tiers hit limits — the escalation plan

| Primary fails | Immediate action |
|---|---|
| Gemini 2.5 Flash rate-limit (15 RPM) | Queue requests client-side; serve stale results while waiting |
| Gemini 2.5 Flash daily cap (1,500) | Switch to Groq Llama 3.2 Vision for vision; use secondary API key from a teammate |
| Groq 70B daily cap (1,000) | Switch to Groq 8B for simpler tasks; keep 70B for Hindi/Marathi copy only |
| Serper quota | Switch to Brave Search API (2,000/mo free) |
| Pollinations rate-limit | Switch to Fal.ai Flux Schnell trial credits |

**Deploy pattern:** every agent calls through a thin wrapper `/lib/agents/call.ts` that tries primary → fallback 1 → fallback 2, with 5s timeout at each step. Build this wrapper **first**, before any individual agent. ~1 hour investment that saves 10 hours of pain.

---

## API keys to grab TONIGHT

Priority order:

1. **Google AI Studio** → Gemini API key (`https://aistudio.google.com`)
2. **Groq Console** → Groq API key (`https://console.groq.com`)
3. **Serper.dev** → Serper API key (`https://serper.dev`)
4. **Fal.ai** → Flux Schnell credits (`https://fal.ai`)
5. **OpenRouter** → unified free-model access (`https://openrouter.ai`)
6. **Shotstack** → $20 trial for Reels (optional)

**Store them in `.env.local`:**

```
GEMINI_API_KEY=...
GROQ_API_KEY=...
SERPER_API_KEY=...
FAL_API_KEY=...
OPENROUTER_API_KEY=...
SHOTSTACK_API_KEY=...
```

Add them to Vercel env tomorrow at 09:30. **Never commit them.**

---

## Build order (12-hour sprint)

### Hour 0 — Scaffolding
- `/lib/agents/call.ts` — the universal wrapper (primary → fallback chain, 5s timeout)
- Env setup across all devs

### Hour 1–3 — Must-ship agents
1. **APPRAISER** (Dev 1)
2. **ANALYST + SHOPKEEPER** (Dev 2)
3. **COPYWRITER + STYLIST** (Dev 2 continues)

### Hour 3–6 — Second wave
4. **PHOTOGRAPHER + GRADER** (Dev 1)
5. **SCOUT** (10 min — anyone)
6. **SCANNER** (Dev 3)

### Hour 6–8 — Dashboard agents
7. **WATCHER** (Dev 3)
8. **RECONNECT** (Dev 3)
9. **CURATOR** (Dev 2, if ahead)

### Hour 8+ — Stretch
10. **DIRECTOR** (Reel generation) — paywall-gated, defer if behind schedule

---

## Pitch moment — naming the agents on stage

After the demo:

> *"Sellit isn't an app with AI inside. Sellit is a team of eleven agents working for Priya.*
>
> *The **Appraiser** identifies what she's selling. The **Analyst** prices it from live market data. The **Shopkeeper** prices what she makes at home. The **Photographer** shoots it. The **Grader** checks the Photographer's work. The **Copywriter** finds the hook. The **Stylist** writes it for every channel in every language. The **Scout** picks where it belongs. The **Scanner** reads her DMs. The **Watcher** tells her when to raise prices. The **Reconnect** brings last week's buyers back for this week's batch.*
>
> *Eleven agents. ₹99 a month. Cheaper than one Instagram manager. Never sleeps."*

This lands with the Pine Labs keynote framing on "The Agent Ecosystem" and Peer Capital's agent thesis.

---

## Open decisions (lock by 09:00)

1. **Gemini API key owner** — personal account or shared team account?
2. **Groq key** — same question
3. **Fallback aggressiveness** — do we cascade on first timeout (5s) or wait for a hard error? *Recommendation:* 5s hard timeout.
4. **Shotstack $20 trial** — claim tonight even if unsure about Reel scope
5. **Pollinations primary vs Fal.ai primary** — for image gen. Pollinations is simpler to integrate (no auth) but Fal is slightly higher quality. *Recommendation:* Pollinations primary, Fal fallback.

---

*Document owner: [you]. Last updated: 24 Oct 2026. v1.0 — agent architecture + free-tier model stack + fallback chains.*
