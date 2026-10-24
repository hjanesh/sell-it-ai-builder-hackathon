// Shared by server and client components.
export const formatINR = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export function fillPrice(text: string, price: number | null): string {
  return text.replaceAll("{{PRICE}}", price ? formatINR(price) : "—");
}

/** wa.me needs digits with country code; assume India for 10-digit numbers. */
export function waNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}
