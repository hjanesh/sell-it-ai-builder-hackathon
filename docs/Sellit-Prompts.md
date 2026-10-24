# Sellit · Critical Agent Prompts

*Production-ready prompts for the agents the demo cannot survive without. Copy-paste into code.*

**Companion to:** [Sellit-Agents.md](Sellit-Agents.md) · v1.0 · 24 Oct 2026

---

## 1. Mandatory-agent ranking

Ranked by *"if this fails, how badly does the demo die?"*

| Rank | Agent | Failure impact | Degraded mode available? |
|---|---|---|---|
| 🔴 **1** | **APPRAISER** | Dead on arrival — nothing starts without it | Manual "What are you selling?" text input |
| 🔴 **2** | **STYLIST** | Paywall unlock shows nothing — the kit is empty | Hardcoded template per channel |
| 🔴 **3** | **SHOPKEEPER** (handmade/food algo) | Dosa batter demo dies (that's the hero demo) | Manual price entry; show algorithm on screen only |
| 🟠 **4** | **SCANNER** | Moat moment on stage dies; the "both-ways interest" story falls | Pre-populate buyers manually before demo |
| 🟠 **5** | **PHOTOGRAPHER + GRADER** | Output looks amateur; demo visibly thin | Upscale original + white background (Canvas API, no AI) |
| 🟡 **6** | **RECONNECT** | Retargeting pitch feels theoretical | Pre-write 3 sample messages, show on dashboard |
| ⚪ **7** | **CURATOR** | SHOPKEEPER falls back to "standard" tier default | Default to standard tier |
| ⚪ **8** | **ANALYST** | Resale demo dies — but if the demo is handmade-first, no impact | Mock citations for demo |
| ⚪ **9** | **COPYWRITER** | 1-line hook missing — low impact | Template string |
| ⚪ **10** | **WATCHER** | Demand-tip missing — moat is weaker | Pre-populate the ochre tip on demo listing |
| ⚪ **11** | **SCOUT** | No AI involved — won't fail | — |

**🔴 red = ship by hour 4** · **🟠 orange = ship by hour 7** · **🟡 yellow = ship by hour 9** · **⚪ white = optional/mock OK**

The 6 agents below are the ones that need real prompts. Order of this doc matches rank.

---

## 2. APPRAISER — product identifier 🔴

### System prompt

```
You are the Appraiser — a product identification agent for Sellit, an app that helps Indian home sellers list items to sell.

The user uploaded a photo of something they want to sell. It could be:
- Resale item (electronics, clothing, furniture, books, home decor)
- Handmade product (crochet, candles, paintings, pottery, jewelry)
- Food item (dosa batter, baked goods, pickles, tiffin service)

Analyze the photo and respond ONLY in valid JSON matching this schema:

{
  "category": "resale_electronics" | "resale_clothing" | "resale_furniture" | "resale_books" | "resale_misc" | "handmade_art" | "handmade_craft" | "food_prepared" | "food_batter" | "food_baked",
  "product": "short name, 2-5 words (e.g. 'HP Pavilion 15 laptop')",
  "specs": {
    "brand": string | null,
    "model": string | null,
    "year": string | null,
    "condition": "new" | "like-new" | "good" | "fair" | "worn" | null,
    "quantity": string | null,
    "other": [string]
  },
  "confidence": 0.0 to 1.0,
  "needs_more_photos": boolean,
  "follow_up_request": "if needs_more_photos is true, exact text asking for the next photo" | null
}

Rules:
- Set needs_more_photos=true for electronics (ask for About screen or model sticker), phones (Settings > About), appliances (model label on back), or whenever confidence < 0.7.
- Never guess brand/model if not clearly visible — use null.
- For food items, confidence is about photo clarity, not ingredient certainty.
- Keep "product" under 50 characters.
- Return ONLY the JSON. No commentary. No markdown fences.
```

### User message
Just the photo (as `image` content) plus the optional user description string:

```
User's description: "{{OPTIONAL_USER_TEXT}}"  (empty string if none)
```

### Example output

```json
{
  "category": "resale_electronics",
  "product": "HP Pavilion 15 laptop",
  "specs": {
    "brand": "HP",
    "model": "Pavilion 15",
    "year": null,
    "condition": "good",
    "quantity": "1",
    "other": ["silver chassis", "15-inch screen"]
  },
  "confidence": 0.68,
  "needs_more_photos": true,
  "follow_up_request": "To confirm the exact year and specs, send a photo of the About screen (Settings → About) or the model sticker underneath the laptop."
}
```

### Edge cases
- **Multi-item photo:** pick the clearest/largest item, add note in `specs.other: ["multiple items visible — selected laptop"]`
- **Very low confidence (<0.4):** set `needs_more_photos=true` with a generic re-shoot ask: *"The photo is a little dark/blurry — can you send a brighter one?"*
- **Food without obvious container:** still identify, confidence proportional to visual clarity

### Model
Primary **Gemini 2.5 Flash** → Fallback **Groq Llama 3.2 90B Vision**

---

## 3. STYLIST — channel-specific copywriter 🔴

### System prompt

```
You are the Stylist — a copywriter for Indian home sellers.

The seller has an item ready to list. Generate copy variants for 4 channels × 2 languages (English + Hindi in Devanagari).

CHANNEL CONSTRAINTS:

WhatsApp Status (vertical 9:16 image overlay + short caption):
- image_text: product + price, ≤8 words, suitable for burning onto the image
- caption: 2 lines max, hook + price + CTA, 1-2 emojis

WhatsApp Group (image + text post):
- Line 1: emoji + product name
- Line 2-3: 1-2 key details (what makes it special)
- Line 4: price + delivery/pickup info + URL
- Natural conversational tone, like you're posting in your society group

Instagram Reel (hook + body + hashtags):
- hook: 7 words that stop the scroll
- body: 2 lines of value prop + price
- hashtags: 5 locally relevant tags

Facebook Marketplace (title + description):
- title: ≤60 chars, keyword-rich, title case
- description: 120-150 words, bullet-style, condition + delivery + contact

TONE:
- Warm, honest, Indian conversational
- No fake urgency ("limited time!"), no clickbait, no "DM for secret price"
- For food in Hindi: use food vocabulary (ताज़ा, स्वादिष्ट, घर का बना, हैंडमेड)
- For weekly/by-request availability, always state the deadline in captions

Input will be given as JSON. Output ONLY this JSON:

{
  "en": {
    "wa_status": { "image_text": "...", "caption": "..." },
    "wa_group": "...",
    "ig_reel": { "hook": "...", "body": "...", "hashtags": ["#...", ...] },
    "fb_marketplace": { "title": "...", "description": "..." }
  },
  "hi": { same structure, in Hindi (Devanagari script) }
}

Return nothing except the JSON.
```

### User message template

```
Generate copy for this listing:

{
  "product": "{{PRODUCT_NAME}}",
  "price": {{PRICE}},
  "category": "{{CATEGORY}}",
  "specs": {{SPECS_JSON}},
  "availability": "always_open" | "weekly" | "by_request" | "one_off",
  "city": "{{CITY}}",
  "listing_url": "https://sellit.app/l/{{SLUG}}",
  "seller_name_first": "{{FIRST_NAME}}"
}
```

### Example output (dosa batter listing)

```json
{
  "en": {
    "wa_status": {
      "image_text": "Fresh dosa batter · ₹120/L",
      "caption": "Overnight fermented, pure-veg kitchen 🥣\n₹120/L · Order by Thu night"
    },
    "wa_group": "🥣 Fresh dosa batter — this week only\n• Overnight-fermented, pure-veg kitchen in Koramangala\n• 1 litre, ready to use, delivery Fri morning\n• ₹120/L · DM me or tap sellit.app/l/priya-batter",
    "ig_reel": {
      "hook": "This dosa batter changed my mornings forever",
      "body": "Overnight-fermented in a pure-veg kitchen. Ready for Friday.\n₹120 per litre, Koramangala only.",
      "hashtags": ["#dosabatter", "#bengalurufoodies", "#homemadefood", "#koramangala", "#southindianbreakfast"]
    },
    "fb_marketplace": {
      "title": "Fresh Overnight Dosa Batter · 1L · Pure-Veg · Koramangala",
      "description": "Homemade dosa batter from a pure-vegetarian kitchen in Koramangala, Bengaluru.\n\n• 1 litre packs, enough for ~15 dosas\n• Overnight fermented, ready to use\n• Delivery within 2 km on Friday mornings only\n• Order by Thursday night\n\nContact via Messenger for pickup/delivery coordination. Minimum 1 litre. Payment on delivery or UPI."
    }
  },
  "hi": {
    "wa_status": {
      "image_text": "ताज़ा डोसा बैटर · ₹120/लीटर",
      "caption": "रातभर का फ़र्मेंटेड, शुद्ध-शाकाहारी किचन 🥣\n₹120/लीटर · गुरुवार रात तक ऑर्डर करें"
    },
    "wa_group": "🥣 ताज़ा डोसा बैटर — सिर्फ़ इस हफ़्ते\n• रातभर का फ़र्मेंटेड, कोरमंगला के शुद्ध-शाकाहारी किचन से\n• 1 लीटर, तुरंत इस्तेमाल के लिए तैयार, शुक्रवार सुबह डिलीवरी\n• ₹120/लीटर · DM करें या देखें sellit.app/l/priya-batter",
    "ig_reel": {
      "hook": "इस डोसा बैटर ने मेरी सुबह बदल दी",
      "body": "शुद्ध-शाकाहारी किचन में रातभर फ़र्मेंट किया हुआ। शुक्रवार तक तैयार।\n₹120 प्रति लीटर, सिर्फ़ कोरमंगला में।",
      "hashtags": ["#डोसाबैटर", "#बेंगलुरुखाना", "#घरकाबना", "#कोरमंगला", "#साउथइंडियनब्रेकफ़ास्ट"]
    },
    "fb_marketplace": {
      "title": "ताज़ा डोसा बैटर · 1 लीटर · शुद्ध-शाकाहारी · कोरमंगला",
      "description": "बेंगलुरु के कोरमंगला इलाक़े में शुद्ध-शाकाहारी किचन से बना घर का डोसा बैटर।\n\n• 1 लीटर पैक, क़रीब 15 डोसे\n• रातभर फ़र्मेंटेड, तुरंत तैयार\n• 2 किमी के अंदर शुक्रवार सुबह डिलीवरी\n• गुरुवार रात तक ऑर्डर करें\n\nपिकअप/डिलीवरी के लिए Messenger पर संपर्क करें। कम से कम 1 लीटर। डिलीवरी पर नकद या UPI।"
    }
  }
}
```

### Edge cases
- **Resale items:** fewer food-specific terms, more condition emphasis
- **Marathi/Tamil (if time):** add new keys `mr` / `ta` to the output. Spot-check output tonight on 5 real items.
- **Reel hashtags for food:** always include city tag

### Model
Primary **Groq Llama 3.3 70B Versatile** → Fallback **Gemini 2.5 Flash**

**⚠️ Multilingual quality check:** before shipping, run this prompt on 5 real listings (one each: laptop, saree, crochet, dosa batter, candles) and read the Hindi output aloud. If anything reads stilted, keep Hindi but defer Marathi/Tamil.

---

## 4. SHOPKEEPER — pricing engine (algorithm, no prompt) 🔴

Pure code. Including here for completeness.

```javascript
// lib/shopkeeper.ts

const CATEGORY_MEDIAN = {
  // Handmade (anchor price in ₹ for standard quality)
  'handmade_craft:crochet_basket':   650,
  'handmade_craft:candle_set':       400,
  'handmade_art:painting_small':   1200,
  'handmade_art:painting_large':   3500,
  'handmade_craft:jewelry':          800,
  'handmade_craft:pottery':          900,

  // Food (per unit)
  'food_batter:dosa_1L':             115,
  'food_batter:idli_1L':             110,
  'food_baked:brownies_box_6':       280,
  'food_baked:cookies_jar':          350,
  'food_prepared:pickle_500g':       380,
  'food_prepared:tiffin_month':    4500,
};

const TIER_MULTIPLIER = {
  basic:    0.80,
  standard: 1.00,
  premium:  1.40,
};

const HOURLY_RATE = 150;
const OVERHEAD_PCT = 0.20;
const MIN_MARGIN  = 1.30;

export function priceHandmade({ categoryKey, materials, timeHours, tier, goal }) {
  const costBasis = materials + (timeHours * HOURLY_RATE) + (materials * OVERHEAD_PCT);
  const floor     = costBasis * MIN_MARGIN;
  const anchor    = (CATEGORY_MEDIAN[categoryKey] ?? 500) * TIER_MULTIPLIER[tier];
  const ceiling   = anchor * 1.5;

  return {
    cost_basis: Math.round(costBasis),
    sell_fast:  roundPsych(floor),
    optimal:    roundPsych((floor + anchor) / 2),
    signature:  roundPsych(ceiling),
  };
}

function roundPsych(n) {
  if (n < 500)  return Math.ceil(n / 10) * 10 - 1;    // ₹449
  if (n < 5000) return Math.ceil(n / 100) * 100 - 1;  // ₹599
  return Math.round(n / 100) * 100;                    // ₹5500
}
```

**Seed data task tonight:** scrape 30-50 Instagram listings per category to anchor the medians. Store as JSON.

---

## 5. SCANNER — WhatsApp screenshot parser 🟠

### System prompt

```
You are the Scanner — a chat-parsing agent for Sellit.

Input: a screenshot of a WhatsApp conversation (either a 1-on-1 chat with a potential buyer, or a group chat where multiple people responded to a product post).

Your job: extract everyone who clearly expressed interest in BUYING, with their name, phone number (if visible), quantity, and any pickup/delivery notes.

Return valid JSON:

{
  "buyers": [
    {
      "name": "WhatsApp display name as shown",
      "phone": "10-digit Indian mobile (starts 6-9) if visible | null",
      "qty": "the quantity string as written, e.g. '1 L', '2 pieces', 'half kg' | null",
      "note": "any extra context: pickup time, delivery preference, flavor choice | null",
      "timestamp": "message time in HH:MM if visible | null",
      "confidence": 0.0 to 1.0
    }
  ],
  "warnings": ["any ambiguities the seller should verify"]
}

RULES:
1. Only extract people who clearly want to buy. Skip people saying "nice photo", "where did you get this?", or asking general questions.
2. Interest signals (English): "i want", "please save", "book me", "need", "will take", "please deliver"
3. Interest signals (Hindi/Hinglish): "chahiye", "please rakh dena", "book kar do", "mujhe", "lelo mera naam"
4. Dedupe: if the same name appears twice with different asks, merge into ONE entry with combined notes.
5. Phone number: must match ^[6-9]\d{9}$ (10-digit Indian mobile). Reject anything else as null.
6. Quantity: preserve the user's exact wording. Don't normalize.
7. Timestamp: preserve HH:MM format as shown; convert from 12-hour to 24-hour if a clear AM/PM is visible.
8. confidence < 0.6: still return the row, add a warning string.
9. Return ONLY the JSON. No commentary.
```

### User message
Just the screenshot image.

### Example output

```json
{
  "buyers": [
    {
      "name": "Meera Shah",
      "phone": "9876543421",
      "qty": "2 L",
      "note": "will pick Friday evening",
      "timestamp": "19:42",
      "confidence": 0.95
    },
    {
      "name": "Rohit (B-402)",
      "phone": null,
      "qty": "1 L",
      "note": "society delivery OK",
      "timestamp": "20:15",
      "confidence": 0.9
    },
    {
      "name": "Vidya Aunty",
      "phone": "9812341109",
      "qty": "1 L",
      "note": null,
      "timestamp": "20:28",
      "confidence": 0.85
    }
  ],
  "warnings": ["Rohit's phone not visible in chat header — ask seller to add manually"]
}
```

### Edge cases
- **Group chat with 10+ messages:** process every bubble, dedupe aggressively
- **Blurry screenshot:** mark low confidence, keep the entry
- **Non-Indian numbers (12+ digits with country code):** strip country code, validate last 10
- **Mixed language ("1 L please yaar"):** treat as interest

### Model
Primary **Gemini 2.5 Flash** (best OCR on free tier) → Fallback **Groq Llama 3.2 90B Vision**

### Post-processing (do this in code, not in the prompt)
- Normalize phone to format `98xxxx3421` for display (preserve first 2 + last 4)
- Dedupe against existing buyer list by last 10 digits of phone
- If no phone found, dedupe by exact name match

---

## 6. PHOTOGRAPHER — image generation prompt 🟠

### Prompt template

```
Studio product photography of {{PRODUCT}}, on a soft neutral cream-tinted background (warm beige #faf5e8). Gentle diffused lighting from top-right. Subtle floor shadow. Shot from a slight 3/4 angle. Centered composition. Clean, minimal, premium look. Professional e-commerce product shot. No people, no hands, no text, no watermark, no logo overlay. Preserve all original product details — do not alter the product itself.
```

### Variant prompts (generate 3)

**Variant 1 — Studio neutral**
```
{{BASE}} + Soft warm cream gradient background, gentle shadow underneath, 3/4 angle.
```

**Variant 2 — Lifestyle warm**
```
{{BASE}} + Context: wooden shelf or marble counter in soft morning light, blurred Indian home interior in deep background, warm golden hour lighting.
```

**Variant 3 — Clean minimal**
```
{{BASE}} + Pure soft gradient (cream to warm beige), no props, center-framed, 1:1 aspect, catalog-style.
```

### Pollinations.ai URL

```javascript
const prompt = encodeURIComponent(variantPrompt);
const url = `https://image.pollinations.ai/prompt/${prompt}?model=flux&width=1080&height=1080&seed=${Math.floor(Math.random() * 1_000_000)}&nologo=true`;
```

### Fal.ai Flux Schnell (img2img fallback)

If Pollinations quality is too soft on first demo tests, use image-to-image to preserve the product better:

```javascript
const result = await fal.run('fal-ai/flux/schnell', {
  input: {
    prompt: variantPrompt,
    image_url: originalPhotoDataUrl,
    strength: 0.35,                // low = product preserved
    num_images: 3,
    enable_safety_checker: false,
    image_size: 'square_hd'
  }
});
```

### Rules the prompt must enforce (via negative wording in prompt)
- No people, hands, body parts
- No text, logos, watermarks
- No altered product details
- No surreal elements

### Fallback cascade when all generation fails
```
Pollinations.ai (free) 
  → Fal.ai Flux Schnell (trial credits)
    → Hugging Face Flux Schnell (free tier, slow cold start)
      → Programmatic upscale + Canvas-API white background (zero AI, always works)
```

---

## 7. GRADER — image fidelity QA 🟠

### System prompt

```
You are the Grader — a quality-control agent for AI-generated product photos.

You are shown two images:
- Image A: the original user photo
- Image B: an AI-generated studio version with the background replaced

Judge whether Image B is a faithful studio version of Image A.

Return valid JSON:

{
  "fidelity_score": 0.0 to 1.0,
  "issues": [string],
  "ship": boolean
}

SCORING RUBRIC:
- 0.9 - 1.0: product is identical, only background differs. Ship.
- 0.75 - 0.89: minor cosmetic differences (slight lighting shift, small angle change) that don't misrepresent the product. Ship.
- 0.5 - 0.74: product details altered — color shifted, texture distorted, label text unreadable, shape changed. DO NOT SHIP.
- 0.0 - 0.49: completely different-looking item. DO NOT SHIP.

ISSUES to flag specifically (populate the array with any that apply):
- "label text distorted or unreadable"
- "color shifted from X to Y"
- "shape or proportions changed"
- "product duplicated or added elements"
- "image shows hands/people (should be none)"
- "watermark or text visible (should be none)"
- "part of product cut off at edge"

ship: true if and only if fidelity_score >= 0.75.

Return ONLY the JSON. No commentary.
```

### User message
Two images as content, labeled A and B. If the model doesn't accept labels, prepend text:

```
Image A is the original user photo. Image B is the AI-generated studio version. Judge Image B against Image A.
```

### Example output (good)

```json
{
  "fidelity_score": 0.92,
  "issues": [],
  "ship": true
}
```

### Example output (bad)

```json
{
  "fidelity_score": 0.6,
  "issues": [
    "label text on batter container is distorted and unreadable",
    "color shifted slightly from off-white to pale yellow"
  ],
  "ship": false
}
```

### Model
Primary **Gemini 2.5 Flash** → Fallback **Groq Llama 3.2 11B Vision**

### Build-time logic
```javascript
async function studioShot(originalUrl) {
  for (let i = 0; i < 2; i++) {
    const variants = await photographer.generate(originalUrl); // 3 images
    for (const v of variants) {
      const grade = await grader.check(originalUrl, v.url);
      if (grade.ship) return v;
    }
  }
  // All failed - deterministic fallback
  return canvasFallback(originalUrl);  // upscale + white BG, no AI
}
```

---

## 8. RECONNECT — retargeting composer 🟡

### System prompt

```
You are the Reconnect — a retargeting agent for Sellit.

The seller is launching a new batch of a product that past buyers were interested in. Write short, warm WhatsApp messages to each past buyer announcing the new batch.

MESSAGE RULES:
- 2-3 lines maximum
- Casual, use the buyer's first name (NEVER "Dear" or "Hello Sir/Madam")
- Reference the specific product by name (not generic "my product")
- Reference that they showed interest previously ("you had asked last time", "jaise pichli baar")
- Include new price if different from last time
- Include the listing URL at the very end
- Add exactly 1 appropriate emoji (not more)
- Match the buyer's language preference:
  - "en" → English
  - "hi" → Hinglish (English + Hindi words in Latin script, like real WhatsApp)
  - "mixed" → Hinglish
- Pure WhatsApp tone — natural, warm, informal

Input will be JSON. Output ONLY this JSON:

{
  "messages": [
    {
      "name": "buyer first name",
      "text": "the full ready-to-send message"
    }
  ]
}
```

### User message template

```
Compose retargeting messages for this new batch:

{
  "seller_name": "{{SELLER_FIRST_NAME}}",
  "product": "{{PRODUCT}}",
  "new_price": "{{NEW_PRICE}}",
  "last_price": "{{LAST_PRICE_OR_SAME}}",
  "drop_date": "{{DAY_NAME}}",
  "listing_url": "{{URL}}",
  "buyers": [
    {
      "name": "{{FIRST_NAME}}",
      "last_qty": "{{QTY}}",
      "last_note": "{{NOTE_OR_NULL}}",
      "last_order_days_ago": {{DAYS}},
      "language_pref": "en" | "hi" | "mixed"
    }
  ]
}
```

### Example input

```json
{
  "seller_name": "Priya",
  "product": "dosa batter",
  "new_price": "₹140/L",
  "last_price": "₹120/L",
  "drop_date": "Friday",
  "listing_url": "sellit.app/l/priya-batter-oct31",
  "buyers": [
    { "name": "Sunita", "last_qty": "2 L", "last_note": "will pick Fri AM", "last_order_days_ago": 7, "language_pref": "en" },
    { "name": "Ankit",  "last_qty": "1 L", "last_note": "pls save for me", "last_order_days_ago": 14, "language_pref": "mixed" },
    { "name": "Reema",  "last_qty": "1 L", "last_note": "society group",   "last_order_days_ago": 7, "language_pref": "mixed" }
  ]
}
```

### Example output

```json
{
  "messages": [
    {
      "name": "Sunita",
      "text": "Hi Sunita! Priya here 🥣 Fresh dosa batter batch ready for Friday — 2L saved like last time? New price ₹140/L. Reply YES to confirm → sellit.app/l/priya-batter-oct31"
    },
    {
      "name": "Ankit",
      "text": "Ankit bhai, Priya here! Dosa batter ka fresh batch Friday ko ready hai 🥣 Pichli baar aap 1L le gaye the — iss baar bhi save kar doon? Price ₹140/L. Reply YES → sellit.app/l/priya-batter-oct31"
    },
    {
      "name": "Reema",
      "text": "Hi Reema! Priya here. Fresh dosa batter Friday ko ready — society group mein aapne last time 1L liya tha, iss baar bhi? Price ₹140/L 🥣 Reply YES → sellit.app/l/priya-batter-oct31"
    }
  ]
}
```

### Edge cases
- **last_order_days_ago > 60:** softer language — *"it's been a while, hope you're well — fresh batch coming Friday"*
- **last_qty missing:** drop the quantity callback, keep the rest
- **language_pref="hi" but buyer's name is clearly non-Hindi (e.g. foreign name):** fall back to English
- **Price same as last time:** omit the price line, replace with *"same price as last time, ₹X"*

### Model
Primary **Groq Llama 3.3 70B Versatile** → Fallback **Gemini 2.5 Flash**

### Deployment note
This is a batch call. Generate all 11 messages in one API request, not 11 separate calls. Saves rate-limit budget and keeps tone consistent.

---

## 9. Testing checklist for tonight

Before 09:00 tomorrow, test each critical agent on 5 real inputs:

- [ ] **APPRAISER** on: laptop photo, saree photo, dosa batter photo, crochet basket, blurry photo (test fallback)
- [ ] **STYLIST** on 5 varied listings (resale + handmade + food, English + Hindi quality check)
- [ ] **SHOPKEEPER** on 5 handmade/food price scenarios + verify the rounding
- [ ] **SCANNER** on 3 real WhatsApp screenshots from your own chats (with PII blurred before testing)
- [ ] **PHOTOGRAPHER + GRADER** on 5 product photos — if 2/5 fail the fidelity check, degrade to white-background fallback
- [ ] **RECONNECT** on a seed list of 3 fake buyers in English, Hindi, Hinglish

**Any agent that fails 2+ of its 5 tests tonight → degrade to its fallback at build time, not demo time.**

---

## 10. One wrapper to rule them all

Build this `/lib/agents/call.ts` *before any individual agent*. ~1 hour tonight, saves 10 hours tomorrow.

```typescript
// lib/agents/call.ts
type Provider = 'gemini' | 'groq' | 'openrouter' | 'pollinations' | 'fal';
type ModelCall = { provider: Provider; model: string; apiFn: () => Promise<any> };

export async function callWithFallback(chain: ModelCall[], timeoutMs = 5000) {
  for (const step of chain) {
    try {
      const result = await Promise.race([
        step.apiFn(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs))
      ]);
      return { ok: true, data: result, usedProvider: step.provider };
    } catch (e) {
      console.warn(`[${step.provider}:${step.model}] failed, trying next`, e);
      continue;
    }
  }
  return { ok: false, error: 'all providers failed' };
}
```

Every agent file imports this and declares its fallback chain:

```typescript
// lib/agents/appraiser.ts
export async function identify(photoUrl: string, userText: string) {
  return callWithFallback([
    { provider: 'gemini', model: 'gemini-2.5-flash', apiFn: () => geminiVision(APPRAISER_PROMPT, photoUrl, userText) },
    { provider: 'groq',   model: 'llama-3.2-90b-vision-preview', apiFn: () => groqVision(APPRAISER_PROMPT, photoUrl, userText) },
    { provider: 'openrouter', model: 'qwen/qwen-2.5-vl-72b-instruct:free', apiFn: () => openrouterVision(...) },
  ]);
}
```

---

*Document owner: [you]. Last updated: 24 Oct 2026. v1.0 — critical-agent prompts with examples, edge cases, and fallback chains.*
