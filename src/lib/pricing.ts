// Price cards (spec §4.5): Sell fast / Recommended / Best price come from the real search range.
// For homemade items the seller can add materials + hours; that cost floor is never undercut.

export const HOURLY_RATE = 150; // ₹ per hour of the seller's time
const OVERHEAD = 0.2; // share of materials (gas, packaging, wastage)
const MIN_MARGIN = 0.3;

export type Cost = { materials: number; hours: number };
export type PriceCards = { fast: number; recommended: number; best: number; floor: number | null };

/** Cost basis plus a 30% margin, rounded the way small sellers price (₹449, ₹599, ₹5,200). */
export function costFloor({ materials, hours }: Cost): number | null {
  if (!(materials > 0) && !(hours > 0)) return null;
  const basis = materials * (1 + OVERHEAD) + hours * HOURLY_RATE;
  return roundPrice(basis * (1 + MIN_MARGIN), "up");
}

/** Under ₹500 ends in 9, up to ₹5,000 ends in 99, above that the nearest ₹100. */
export function roundPrice(v: number, dir: "up" | "nearest" = "nearest"): number {
  const f = dir === "up" ? Math.ceil : Math.round;
  if (v < 500) return Math.max(9, f((v + 1) / 10) * 10 - 1);
  if (v <= 5000) return f((v + 1) / 100) * 100 - 1;
  return f(v / 100) * 100;
}

export function priceCards(range: { low: number; recommended: number; high: number }, floor: number | null): PriceCards {
  const atLeast = (v: number) => (floor && v < floor ? floor : v);
  const fast = atLeast(range.low);
  const recommended = Math.max(fast, atLeast(range.recommended));
  const best = Math.max(recommended, atLeast(range.high));
  return { fast, recommended, best, floor };
}
