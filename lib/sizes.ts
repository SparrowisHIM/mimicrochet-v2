import type { Product } from "@/lib/products";

export const sizeChart = [
  { size: "XS", uk: "6", bust: 78, waist: 62, hips: 86 },
  { size: "S", uk: "8", bust: 82, waist: 66, hips: 90 },
  { size: "M", uk: "8–10", bust: 86, waist: 70, hips: 94 },
  { size: "L", uk: "12–14", bust: 94, waist: 78, hips: 102 },
  { size: "XL", uk: "16", bust: 102, waist: 86, hips: 110 },
] as const;

export const sizeLabels = sizeChart.map((s) => s.size);

const kids = new Set(["kids-granny-vest", "mini-pink-crochet-dress"]);

/** Pieces chosen by S/M/L. Hats, earrings and kids' pieces are sized with Mimi instead. */
export function hasSizes(p: Product) {
  return p.category !== "Hats" && p.category !== "Earrings" && !kids.has(p.slug);
}

export function stockLine(size: string) {
  const row = sizeChart.find((s) => s.size === size);
  if (size === "XL") return "In stock in XL, ready to send";
  return row ? `In stock in ${size} (UK ${row.uk}), ready to send` : `In stock in ${size}, ready to send`;
}
