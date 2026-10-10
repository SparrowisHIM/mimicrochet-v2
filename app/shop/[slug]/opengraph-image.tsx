import { serifStyle, shareCard, shareSize, shareType } from "@/components/share/share-card";
import { getProduct, priceLabel, products, tagLabel } from "@/lib/products";

// The card when someone sends one piece: its own photo, label, name and price, in the product page's order.
export const alt = "A piece by Mimicrochet, with its name and price";
export const size = shareSize;
export const contentType = shareType;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProduct((await params).slug);
  if (!p) return shareCard({ photo: "/images/story/hero-ruby.jpg", children: <span style={serifStyle(76)}>Crochet pieces worth being seen in.</span> });
  // long names drop a size so they stay on two or three lines
  const nameSize = p.name.length > 22 ? 64 : 76;
  return shareCard({
    photo: p.images[0],
    children: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontFamily: "Figtree", fontWeight: 600, fontSize: 28, color: p.kind === "ready" ? "#065f46" : "#92400e" }}>{tagLabel(p)}</span>
        <span style={{ ...serifStyle(nameSize), marginTop: 16 }}>{p.name}</span>
        <span style={{ fontFamily: "Figtree, Naira", fontWeight: 500, fontSize: 36, marginTop: 16 }}>{priceLabel(p)}</span>
      </div>
    ),
  });
}
