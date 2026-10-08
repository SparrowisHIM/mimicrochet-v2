import type { Customer } from "@/lib/customers";
import type { Idea } from "@/lib/ideas";
import type { Product } from "@/lib/products";
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
};

export function pieceFromProduct(p: Product): Piece {
  return { source: "product", slug: p.slug, name: p.name, image: p.images[0], price: p.price, priceFrom: true, sized: hasSizes(p) };
}

/** "Have yours made" from a customer's story: what they're wearing, priced with Mimi. */
export function pieceFromCustomer(c: Customer): Piece {
  const names = c.wearing.map((w, i) => (i === 0 ? w.name : w.name.toLowerCase()));
  return { source: "story", slug: c.slug, name: names.join(" and "), image: c.photos[0].src, price: null, sized: true, note: `As ${c.name} wore it` };
}

export function pieceFromIdea(i: Idea): Piece {
  return { source: "idea", slug: i.slug, name: i.name, image: i.image, price: i.priceFrom, priceFrom: true, sized: !["Hats", "Bags"].includes(i.category) };
}
