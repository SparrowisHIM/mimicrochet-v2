import { products, type Category, type ColourGroup, type Product } from "@/lib/products";

export type Sort = "newest" | "price-asc" | "price-desc";

export type ShopFilters = {
  type: "all" | "ready" | "made";
  category: Category | "all";
  /** [lowest, highest] in naira, or null for any price. */
  price: [number, number] | null;
  colours: ColourGroup[];
  /** The exact shade dragged to in the colour picker (colours holds the groups it matched). */
  shade: { h: number; s: number; v: number } | null;
  sort: Sort;
  query: string;
};

export const defaultFilters: ShopFilters = { type: "all", category: "all", price: null, colours: [], shade: null, sort: "newest", query: "" };

/** Every price in the shop, and the span the price slider covers. */
export const shopPrices = products.flatMap((p) => (p.price === null ? [] : [p.price]));
export const priceDomain: [number, number] = [Math.floor(Math.min(...shopPrices) / 1000) * 1000, Math.ceil(Math.max(...shopPrices) / 1000) * 1000];

export const sorts: { key: Sort; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
];

/** Every typed word must start a word in the piece's details, so "red" finds red pieces, not "covered". */
function matchesQuery(p: Product, q: string) {
  if (!q) return true;
  const words = `${p.name} ${p.category} ${p.colour} ${p.colours.join(" ")} ${p.description}`.toLowerCase().split(/[^\p{L}\p{N}]+/u);
  return q
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .every((w) => words.some((h) => h.startsWith(w)));
}

/** Everything except `skip` applied: used for live counts on each chip. */
export function applyFilters(f: ShopFilters, skip?: keyof ShopFilters, list: Product[] = products) {
  let out = list.filter((p) => {
    if (skip !== "type" && f.type !== "all" && p.kind !== f.type) return false;
    if (skip !== "category" && f.category !== "all" && p.category !== f.category) return false;
    if (skip !== "price" && f.price && (p.price === null || p.price < f.price[0] || p.price > f.price[1])) return false;
    if (skip !== "colours" && f.colours.length && !f.colours.some((c) => p.colours.includes(c))) return false;
    if (skip !== "query" && !matchesQuery(p, f.query)) return false;
    return true;
  });
  if (f.sort !== "newest") {
    const dir = f.sort === "price-asc" ? 1 : -1;
    out = [...out].sort((a, b) => {
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return (a.price - b.price) * dir;
    });
  }
  return out;
}
