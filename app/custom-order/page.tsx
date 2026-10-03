import type { Metadata } from "next";
import { CustomOrderFlow } from "@/components/custom-order/flow";
import { getIdea } from "@/lib/ideas";
import { pieceFromIdea, pieceFromProduct } from "@/lib/pieces";
import { getProduct } from "@/lib/products";

export const metadata: Metadata = {
  title: "Custom order",
  description: "Send Mimi a photo, one of her pieces or your own idea. She agrees the price on WhatsApp and you follow every step with a tracking link.",
};

export default async function CustomOrderPage({ searchParams }: PageProps<"/custom-order">) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const product = getProduct(one(q.piece) ?? "");
  const idea = getIdea(one(q.idea) ?? "");
  const piece = product ? pieceFromProduct(product) : idea ? pieceFromIdea(idea) : undefined;

  return <CustomOrderFlow initialPiece={piece} initialSize={one(q.size)} />;
}
