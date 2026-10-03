import { FreshOffTheHook } from "@/components/home/fresh-off-the-hook";
import { Hero } from "@/components/home/hero";
import { MeetMimi } from "@/components/home/meet-mimi";
import { OrderStory } from "@/components/home/order-story";
import { WornLoved } from "@/components/home/worn-loved";
import { customers } from "@/lib/customers";
import { getProduct, products, type Product } from "@/lib/products";

// The Home grid leads with Mimi's best-known pieces, then mixes in what's ready.
const featured = [
  "candy-bloom-ruffle-set",
  "monochrome-crochet-shirt",
  "sunshine-crochet-mini-dress",
  "red-fringe-beach-set",
  "lilac-ruffle-tube-dress",
  "royal-wave-crochet-shirt",
  "fuchsia-ruffle-beach-set",
  "olive-bloom-crochet-shirt",
];

export default function Home() {
  const lead = featured.map((s) => getProduct(s)).filter(Boolean) as Product[];
  const rest = products.filter((p) => !featured.includes(p.slug));
  return (
    <>
      <Hero />
      <FreshOffTheHook pieces={[...lead, ...rest]} />
      <OrderStory />
      <WornLoved customers={customers} />
      <MeetMimi />
    </>
  );
}
