// "Worn, loved, re-worn": real customers in pieces Mimi made.
// Favour's name, city and words are real. Emeka's and Tobi's names, cities and words are
// placeholders until Mimi confirms them (see notes): replace, never invent new quotes.

export type Customer = {
  slug: string;
  name: string;
  city: string;
  quote: string;
  /** What they're wearing, shown in the story instead of a product name. */
  wearing: { name: string; detail: string; image: string; href?: string }[];
  photos: { src: string; alt: string; caption?: string }[];
  /** Status for the team: confirmed by Mimi, or placeholder copy. */
  confirmed: boolean;
};

export const customers: Customer[] = [
  {
    slug: "favour",
    name: "Favour",
    city: "Bayelsa",
    quote: "It’s so beautiful. I love it ❤️",
    wearing: [
      { name: "Ruffle bucket hat", detail: "Made to order", image: "/images/customers/favour-6.jpg" },
      { name: "Crochet bikini", detail: "Made to order", image: "/images/customers/favour-5.jpg" },
    ],
    photos: [
      { src: "/images/customers/favour-2.jpg", alt: "Favour in a ruffle bucket hat and crochet bikini, lowering her sunglasses", caption: "Shot under a sunset lamp. In daylight, it’s hot pink and baby pink." },
      { src: "/images/customers/favour-3.jpg", alt: "Favour standing in the crochet bikini and ruffle hat under orange light" },
      { src: "/images/customers/favour-1.jpg", alt: "Favour in profile wearing the ruffle hat" },
      { src: "/images/customers/favour-4.jpg", alt: "Close view of the granny-stitch bikini top" },
      { src: "/images/customers/favour-5.jpg", alt: "Favour in daylight, the hat and top in hot pink and baby pink", caption: "Daylight: the real colours." },
      { src: "/images/customers/favour-6.jpg", alt: "The back of the ruffle bucket hat" },
    ],
    confirmed: true,
  },
  {
    slug: "emeka",
    name: "Emeka",
    city: "Port Harcourt",
    quote: "Neat work. It fits just right.",
    wearing: [{ name: "Olive Bloom Shirt", detail: "Ready to wear", image: "/images/products/olive-bloom-crochet-shirt-1.jpg", href: "/shop/olive-bloom-crochet-shirt" }],
    photos: [
      { src: "/images/customers/emeka-1.jpg", alt: "A customer in the Olive Bloom crochet shirt, standing between two grey doors" },
      { src: "/images/customers/emeka-2.jpg", alt: "The same customer looking down at the shirt" },
    ],
    confirmed: false,
  },
  {
    slug: "tobi",
    name: "Tobi",
    city: "Abuja",
    quote: "Came quicker than I expected, and the stitching is so neat.",
    wearing: [{ name: "Emerald Everyday Shirt", detail: "Made to order", image: "/images/customers/tobi-1.jpg" }],
    photos: [{ src: "/images/customers/tobi-1.jpg", alt: "A customer taking a mirror selfie in a green crochet shirt" }],
    confirmed: false,
  },
];

export function getCustomer(slug: string) {
  return customers.find((c) => c.slug === slug);
}
