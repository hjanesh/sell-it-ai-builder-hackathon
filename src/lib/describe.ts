import type { ItemContext } from "./schemas";

/** Plain-text summary of everything we know about the item, shared by the price and packs prompts. */
export function describeItem(ctx: ItemContext): string {
  const d = ctx.detect;
  const lines = [
    `Item: ${d.title}`,
    `Listing type: ${d.listingType}`,
    `Category: ${d.category}`,
    d.brand && `Brand: ${d.brand}`,
    d.model && `Model: ${d.model}`,
    ...d.attributes.map((a) => `${a.label}: ${a.value}`),
    d.conditionCues.length > 0 && `Condition seen in photos: ${d.conditionCues.join("; ")}`,
    ctx.caption && `Seller's note: ${ctx.caption}`,
    ...Object.entries(ctx.answers)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${d.questions.find((q) => q.id === k)?.label ?? k}: ${v}`),
    ctx.availability && `Availability: ${ctx.availability.replace("_", " ")}`,
    ctx.location && `Location: ${ctx.location}`,
  ];
  return lines.filter(Boolean).join("\n");
}
