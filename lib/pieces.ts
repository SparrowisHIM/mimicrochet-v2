import type { Idea } from "@/lib/ideas";
import type { Product } from "@/lib/products";
import { hasSizes } from "@/lib/sizes";

/** The piece a custom order starts from: one of Mimi's pieces, or an idea. */
export type Piece = {
  source: "product" | "idea";
  slug: string;
  name: string;
  image: string;
  price: number | null;
  priceFrom?: boolean;
  /** Chosen by S/M/L (hats, earrings, bags and kids' pieces are sized with Mimi instead). */
  sized: boolean;
};

export function pieceFromProduct(p: Product): Piece {
  return { source: "product", slug: p.slug, name: p.name, image: p.images[0], price: p.price, priceFrom: true, sized: hasSizes(p) };
}

export function pieceFromIdea(i: Idea): Piece {
  return { source: "idea", slug: i.slug, name: i.name, image: i.image, price: i.priceFrom, priceFrom: true, sized: !["Hats", "Bags"].includes(i.category) };
}
