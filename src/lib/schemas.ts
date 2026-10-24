import { z } from "zod";

// Every AI step returns JSON validated against one of these schemas (CLAUDE.md rule).

export const ListingType = z.enum(["pre_owned", "new", "homemade"]);
export type ListingType = z.infer<typeof ListingType>;

export const Language = z.enum(["en", "hinglish", "hi"]);
export type Language = z.infer<typeof Language>;

export const Question = z.object({
  id: z.string().describe("snake_case key, e.g. bought_when"),
  label: z.string().describe("Short question shown to the seller"),
  kind: z.enum(["chips", "text", "number"]),
  options: z.array(z.string()).describe("Chip options when kind=chips, else empty"),
  prefilled: z.string().nullable().describe("Answer already visible in the photo/caption, else null"),
});
export type Question = z.infer<typeof Question>;

export const DetectResult = z.object({
  listingType: ListingType,
  category: z.string().describe("Plain category, e.g. 'Mobile phone', 'Homemade food: batter'"),
  title: z.string().describe("Specific item name, e.g. 'Apple iPhone 12, 64 GB, Blue'"),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  attributes: z.array(z.object({ label: z.string(), value: z.string() })),
  conditionCues: z.array(z.string()).describe("What the photos show about condition"),
  missingEvidence: z.array(z.string()).describe("Photos/details that would add buyer trust"),
  itemBox: z
    .object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() })
    .describe("Main item bounding box in the FIRST photo, fractions 0-1 of width/height"),
  confidence: z.number().describe("0-1"),
  questions: z.array(Question).describe("3-6 most important unanswered questions, most important first"),
});
export type DetectResult = z.infer<typeof DetectResult>;

export const Comp = z.object({
  title: z.string(),
  priceText: z.string().describe("Price exactly as shown on the page, e.g. '₹28,500'"),
  price: z.number().describe("Rupees as a number"),
  source: z.string().describe("Site name, e.g. OLX, Cashify, Amazon"),
  url: z.string(),
});
export type Comp = z.infer<typeof Comp>;

export const PriceResult = z.object({
  low: z.number(),
  high: z.number(),
  recommended: z.number(),
  currency: z.enum(["INR"]),
  reasons: z.array(z.string()),
  comps: z.array(Comp),
});
export type PriceResult = z.infer<typeof PriceResult>;

export const Channel = z.enum(["whatsapp", "instagram", "olx", "marketplace", "listing_page"]);
export type Channel = z.infer<typeof Channel>;

export const PacksResult = z.object({
  positioning: z.string().describe("One sharp line: what this is and why it's worth buying"),
  place: z
    .array(z.object({ channel: Channel, reason: z.string() }))
    .describe("All 5 channels ranked best-first for THIS item"),
  alsoConsider: z.array(z.string()).describe("Other places worth trying, e.g. Cashify, Etsy; can be empty"),
  olx: z.object({
    categoryPath: z.string().describe("OLX India category > subcategory"),
    title: z.string().describe("Max 70 characters, keyword-rich"),
    description: z.string(),
    details: z.array(z.object({ field: z.string(), value: z.string() })).describe("Category-specific fields OLX asks for"),
  }),
  marketplace: z.object({
    category: z.string(),
    condition: z.string(),
    title: z.string(),
    description: z.string(),
  }),
  instagram: z.object({ caption: z.string(), hashtags: z.array(z.string()), storyText: z.string() }),
  whatsapp: z.object({
    family: z.string(),
    society: z.string(),
    friends: z.string(),
    status: z.string().describe("Very short, for WhatsApp Status"),
  }),
  listingPage: z.object({
    headline: z.string(),
    description: z.string(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })),
  }),
});
export type PacksResult = z.infer<typeof PacksResult>;

// Request bodies
export const DetectRequest = z.object({
  images: z.array(z.string()).min(1).max(6).describe("JPEG data URLs"),
  caption: z.string().max(2000).default(""),
});

export const ItemContext = z.object({
  detect: DetectResult,
  caption: z.string().default(""),
  answers: z.record(z.string(), z.string()).default({}),
  availability: z.enum(["one_off", "weekly_batches", "by_request"]).nullable().default(null),
  location: z.string().default(""),
});
export type ItemContext = z.infer<typeof ItemContext>;

// Packs run in parallel with the price search, so copy uses a {{PRICE}} token the UI fills in
// (and re-fills when the seller edits the price).
export const PacksRequest = ItemContext.extend({
  language: Language.default("en"),
});
