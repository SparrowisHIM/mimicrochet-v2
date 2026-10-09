import type { Customer } from "@/lib/customers";
import { kindOf, type FitKind } from "@/lib/fit-outline";
import type { Idea } from "@/lib/ideas";
import { getProduct, type Product } from "@/lib/products";
import { hasSizes } from "@/lib/sizes";

/** The piece a custom order starts from: one of Mimi's pieces, an idea, or what a customer wore in their story. */
export type Piece = {
  source: "product" | "idea" | "story";
  slug: string;
  name: string;
  image: string;
  price: number | null;
  priceFrom?: boolean;
  /** Chosen by S/M/L (hats, earrings, bags and kids' pieces are sized with Mimi instead). */
  sized: boolean;
  /** Shown under the name instead of the price line, e.g. "As Favour wore it". */
  note?: string;
  /** Which little drawing the fit questions show for it. */
  kind?: FitKind;
};

export function pieceFromProduct(p: Product): Piece {
  return { source: "product", slug: p.slug, name: p.name, image: p.images[0], price: p.price, priceFrom: true, sized: hasSizes(p), kind: kindOf(p.category) };
}

/** "Have yours made" from a customer's story: what they're wearing, priced with Mimi. */
export function pieceFromCustomer(c: Customer): Piece {
  const names = c.wearing.map((w, i) => (i === 0 ? w.name : w.name.toLowerCase()));
  // What they wore is usually one of Mimi's pieces; otherwise guess from its name.
  const first = c.wearing[0];
  const worn = first?.href?.startsWith("/shop/") ? getProduct(first.href.slice(6)) : undefined;
  const guess = /shirt/i.test(first?.name ?? "") ? "Shirts" : /set|shorts/i.test(first?.name ?? "") ? "Sets & shorts" : /top|cardigan|sweater|knit/i.test(first?.name ?? "") ? "Tops & knits" : undefined;
  return { source: "story", slug: c.slug, name: names.join(" and "), image: c.photos[0].src, price: null, sized: true, note: `As ${c.name} wore it`, kind: kindOf(worn?.category ?? guess) };
}

export function pieceFromIdea(i: Idea): Piece {
  return { source: "idea", slug: i.slug, name: i.name, image: i.image, price: i.priceFrom, priceFrom: true, sized: !["Hats", "Bags"].includes(i.category), kind: kindOf(i.category) };
}
