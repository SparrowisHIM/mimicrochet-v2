import { products, type Category, type ColourGroup, type Product } from "@/lib/products";

export type PriceBand = "under40" | "40to60" | "over60";
export type Sort = "newest" | "price-asc" | "price-desc";

export type ShopFilters = {
  type: "all" | "ready" | "made";
  category: Category | "all";
  price: PriceBand | null;
  colours: ColourGroup[];
  sort: Sort;
  query: string;
};

export const defaultFilters: ShopFilters = { type: "all", category: "all", price: null, colours: [], sort: "newest", query: "" };

export const priceBands: { key: PriceBand; label: string; test: (n: number) => boolean }[] = [
  { key: "under40", label: "Under ₦40k", test: (n) => n < 40000 },
  { key: "40to60", label: "₦40k–60k", test: (n) => n >= 40000 && n <= 60000 },
  { key: "over60", label: "Over ₦60k", test: (n) => n > 60000 },
];

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
    if (skip !== "price" && f.price) {
      const band = priceBands.find((b) => b.key === f.price)!;
      if (p.price === null || !band.test(p.price)) return false;
    }
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
