import type { Metadata } from "next";
import { CustomOrderFlow } from "@/components/custom-order/flow";
import { getCustomer } from "@/lib/customers";
import { getIdea } from "@/lib/ideas";
import { pieceFromCustomer, pieceFromIdea, pieceFromProduct } from "@/lib/pieces";
import { asMadeForYou, getProduct } from "@/lib/products";
import { pieceStatus } from "@/lib/server/payments";

export const metadata: Metadata = {
  title: "Custom order",
  description: "Send Mimi a photo, one of her pieces or your own idea. She agrees the price on WhatsApp and you follow every step with a tracking link.",
  alternates: { canonical: "/custom-order" },
};

export default async function CustomOrderPage({ searchParams }: PageProps<"/custom-order">) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const product = getProduct(one(q.piece) ?? "");
  const idea = getIdea(one(q.idea) ?? "");
  const customer = getCustomer(one(q.story) ?? "");
  // A ready piece that has sold is made for you now: no "From ₦…", Mimi prices the remake on WhatsApp.
  const sold = product?.kind === "ready" && (await pieceStatus([product.slug]).then((r) => r.sold.includes(product.slug)).catch(() => false));
  const piece = product ? pieceFromProduct(sold ? asMadeForYou(product) : product) : idea ? pieceFromIdea(idea) : customer ? pieceFromCustomer(customer) : undefined;

  return <CustomOrderFlow initialPiece={piece} initialSize={one(q.size)} />;
}
