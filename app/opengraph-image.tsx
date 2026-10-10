import { serifStyle, shareCard, shareSize, shareType } from "@/components/share/share-card";

// The card for every page that isn't a single piece: the Home hero in miniature.
export const alt = "Mimicrochet: crochet pieces worth being seen in, handmade by Mimi in Port Harcourt";
export const size = shareSize;
export const contentType = shareType;

export default async function Image() {
  return shareCard({
    photo: "/images/story/hero-ruby.jpg",
    children: (
      <div style={{ display: "flex", flexDirection: "column", ...serifStyle(76) }}>
        <span>Crochet pieces</span>
        <span>worth being</span>
        <span>seen in.</span>
      </div>
    ),
  });
}
