// The collection: Mimi's real pieces (her photos), plus concept "ideas" customers can request.
// Names, prices and descriptions come from v1 (data/products.ts) and Mimi's own Pinterest captions.

export const categories = ["Dresses", "Sets & shorts", "Shirts", "Hats", "Tops & knits", "Earrings"] as const;
export type Category = (typeof categories)[number];

export const colourGroups = ["Red", "Pink", "Yellow", "Green", "Blue", "Purple", "Black", "Cream"] as const;
export type ColourGroup = (typeof colourGroups)[number];

export type Product = {
  slug: string;
  name: string;
  category: Category;
  /** ready: one piece exists now. made: Mimi makes it for you. */
  kind: "ready" | "made";
  /** null = price on request (agreed on WhatsApp). */
  price: number | null;
  /** Price is a starting point, final price agreed on WhatsApp. */
  priceFrom?: boolean;
  /** How it's bought: straight into the bag, or as a request to Mimi. */
  checkout: "bag" | "request";
  /** Size of the one piece in stock (ready pieces only). */
  size?: string;
  /** Shown instead of the size for quick made-to-order pieces. */
  leadTime?: string;
  colour: string;
  colours: ColourGroup[];
  description: string;
  images: string[];
  /** A one-of-one piece that has sold. It stays visible so it can be made again to order. */
  sold?: boolean;
};

const img = (slug: string, n = 1) => Array.from({ length: n }, (_, i) => `/images/products/${slug}-${i + 1}.jpg`);

// List order is the shop's default sort, labelled "Newest" (there are no added dates yet).
export const products: Product[] = [
  { slug: "neon-granny-square-dress", name: "Neon Granny Square Dress", category: "Dresses", kind: "made", price: null, checkout: "request", colour: "Black with neon squares", colours: ["Black", "Green", "Purple", "Red"], description: "Fitted sleeveless dress of neon granny squares in lime, orange, purple and pink, each one joined to the next by hand in black yarn.", images: img("neon-granny-square-dress", 2) },
  { slug: "candy-bloom-ruffle-set", name: "Sasha Ruffle Set", category: "Sets & shorts", kind: "ready", price: 40000, checkout: "bag", size: "M", colour: "Pink, orange, blue and yellow", colours: ["Pink", "Yellow", "Blue"], description: "Bright ruffle beach set in pink, orange, blue and yellow, with crochet flowers on the top.", images: img("candy-bloom-ruffle-set") },
  { slug: "red-fringe-beach-set", name: "Ruby Dress", category: "Dresses", kind: "ready", price: 40000, checkout: "bag", size: "M", colour: "Red", colours: ["Red"], description: "Red crochet top and wrap skirt with a long fringe that moves when you do.", images: img("red-fringe-beach-set", 2) },
  { slug: "sunshine-crochet-mini-dress", name: "Sunshine Mini Dress", category: "Dresses", kind: "ready", price: 45000, checkout: "bag", size: "M", colour: "Yellow", colours: ["Yellow"], description: "Bright yellow fitted mini dress with a lace-up back.", images: img("sunshine-crochet-mini-dress", 2) },
  { slug: "olive-bloom-crochet-shirt", name: "Olive Bloom Shirt", category: "Shirts", kind: "ready", price: 80000, checkout: "bag", size: "XL", colour: "Olive with cream flowers", colours: ["Green", "Cream"], description: "Olive green crochet shirt with cream flower squares.", images: img("olive-bloom-crochet-shirt", 2) },
  { slug: "lilac-ruffle-tube-dress", name: "Stasia Dress", category: "Dresses", kind: "ready", price: 60000, checkout: "bag", size: "M", colour: "Lilac and purple", colours: ["Purple"], description: "Strapless mini dress with two tiers of lilac ruffles. The prettiest purple dress.", images: img("lilac-ruffle-tube-dress") },
  { slug: "sunflower-crop-cardigan", name: "Sunflower Crop Cardigan", category: "Tops & knits", kind: "ready", price: 70000, checkout: "bag", size: "M", colour: "Black with yellow sunflowers", colours: ["Black", "Yellow"], description: "Black cropped cardigan covered in yellow crochet sunflowers.", images: img("sunflower-crop-cardigan") },
  { slug: "royal-wave-crochet-shirt", name: "Royal Wave Crochet Shirt", category: "Shirts", kind: "ready", price: 80000, checkout: "bag", size: "XL", colour: "Royal blue, white and light blue", colours: ["Blue"], description: "Blue button-up crochet shirt with a white and light-blue wave pattern.", images: img("royal-wave-crochet-shirt") },
  { slug: "cream-granny-square-mini-dress", name: "Cream Granny Square Mini Dress", category: "Dresses", kind: "ready", price: 60000, checkout: "bag", size: "M", colour: "Cream with coloured squares", colours: ["Cream"], description: "Cream granny-square mini dress with colourful flower squares.", images: img("cream-granny-square-mini-dress", 2) },
  { slug: "candy-stripe-crochet-shirt", name: "Candy Stripe Crochet Shirt", category: "Shirts", kind: "ready", price: 70000, checkout: "bag", size: "XL", colour: "White, navy, pink and yellow", colours: ["Pink", "Yellow", "Blue"], description: "Button-up crochet shirt with a white collar and multicolour stripes.", images: img("candy-stripe-crochet-shirt", 2) },
  { slug: "ivory-beach-skirt-set", name: "Ivory Beach Skirt Set", category: "Sets & shorts", kind: "ready", price: 35000, checkout: "bag", size: "M", colour: "Ivory", colours: ["Cream"], description: "Ivory triangle top with a skirt that laces up the side.", images: img("ivory-beach-skirt-set") },
  { slug: "monochrome-crochet-shirt", name: "Striped Crochet Shirt", category: "Shirts", kind: "made", price: 80000, priceFrom: true, checkout: "request", colour: "Black with white stripes", colours: ["Black"], description: "A black crochet shirt with white stripes, made to order in your size.", images: img("monochrome-crochet-shirt") },
  { slug: "blossin-loom-earrings", name: "Blossin Loom Earrings", category: "Earrings", kind: "made", price: 8000, checkout: "bag", leadTime: "Made in 3 days", colour: "Cobalt blue", colours: ["Blue"], description: "Cobalt blue crochet rosettes on gold studs.", images: img("blossin-loom-earrings") },
  { slug: "florra-loom-earrings", name: "Florra Loom Earrings", category: "Earrings", kind: "made", price: 8000, checkout: "bag", leadTime: "Made in 3 days", colour: "Red", colours: ["Red"], description: "Red crochet flowers with a pearl centre.", images: img("florra-loom-earrings") },
  { slug: "fern-loom-earrings", name: "Fern Loom Earrings", category: "Earrings", kind: "made", price: 8000, checkout: "bag", leadTime: "Made in 3 days", colour: "Green and cream", colours: ["Green", "Cream"], description: "Green and cream crochet swirl circles.", images: img("fern-loom-earrings") },
  { slug: "sun-spell-hoop-earrings", name: "Sun Spell Hoop Earrings", category: "Earrings", kind: "made", price: 8000, checkout: "bag", leadTime: "Made in 3 days", colour: "Orange", colours: ["Yellow"], description: "Orange crochet hoops on gold studs.", images: img("sun-spell-hoop-earrings") },
  { slug: "noir-bloom-crochet-shirt", name: "Noir Bloom Shirt", category: "Shirts", kind: "ready", price: 90000, checkout: "bag", size: "XL", colour: "Black and white", colours: ["Black"], description: "Black crochet shirt with white bloom squares, joined by hand one square at a time.", images: img("noir-bloom-crochet-shirt", 2) },
  { slug: "heart-sweater", name: "Heart Sweater", category: "Tops & knits", kind: "made", price: null, checkout: "request", colour: "Black with purple hearts", colours: ["Black", "Purple"], description: "Black sweater with rows of purple crochet hearts.", images: img("heart-sweater") },
  { slug: "hot-body-set", name: "The Hot Body Set", category: "Sets & shorts", kind: "made", price: null, checkout: "request", colour: "Pink and cream", colours: ["Pink", "Cream"], description: "Pink triangle top with cream shorts, pink trim and tie sides.", images: img("hot-body-set", 2) },
  { slug: "bloomer-shorts", name: "Bloomer Shorts", category: "Sets & shorts", kind: "made", price: null, checkout: "request", colour: "Red or pink", colours: ["Red", "Pink"], description: "Ruffled bloomer shorts, shown here in red and in pink.", images: img("bloomer-shorts") },
  { slug: "fuchsia-ruffle-beach-set", name: "Fuchsia Ruffle Set", category: "Sets & shorts", kind: "ready", price: 35000, checkout: "bag", size: "M", colour: "Fuchsia", colours: ["Pink"], description: "Fuchsia crochet triangle top with ruffle shorts.", images: img("fuchsia-ruffle-beach-set", 2) },
  { slug: "black-bloom-mesh-mini-dress", name: "Black Bloom Mesh Mini Dress", category: "Dresses", kind: "ready", price: 35000, checkout: "bag", size: "M", colour: "Black with orange flowers", colours: ["Black"], description: "Black mesh crochet mini dress with orange flowers on the bust.", images: img("black-bloom-mesh-mini-dress") },
  { slug: "cocoa-stripe-beach-set", name: "Terra Set", category: "Sets & shorts", kind: "ready", price: 35000, checkout: "bag", size: "M", colour: "Brown, cream and black", colours: ["Black", "Cream"], description: "Brown, cream and black striped triangle top and mini skirt. Art to wear.", images: img("cocoa-stripe-beach-set") },
  { slug: "cream-granny-square-vest", name: "Cream Granny Square Vest", category: "Tops & knits", kind: "ready", price: 50000, checkout: "bag", size: "M", colour: "Cream with coloured squares", colours: ["Cream"], description: "Sleeveless cream granny-square vest with multicolour squares.", images: img("cream-granny-square-vest") },
  { slug: "pink-stripe-set", name: "Pink Stripe Set", category: "Sets & shorts", kind: "made", price: null, checkout: "request", colour: "Red and pink", colours: ["Red", "Pink"], description: "Red and pink striped triangle top with a matching mini skirt.", images: img("pink-stripe-set", 3) },
  { slug: "pink-granny-shorts-set", name: "Pink Granny Shorts Set", category: "Sets & shorts", kind: "made", price: null, checkout: "request", colour: "Pink and black", colours: ["Pink", "Black"], description: "Pink triangle top with black granny-square ruffle shorts.", images: img("pink-granny-shorts-set") },
  { slug: "sunflower-crochet-bucket-hat", name: "Sunflower Bucket Hat", category: "Hats", kind: "ready", price: 15000, checkout: "bag", size: "One size", colour: "Black, yellow and white", colours: ["Black", "Yellow"], description: "Black bucket hat with yellow and white sunflower squares and a ruffled brim.", images: img("sunflower-crochet-bucket-hat") },
  { slug: "navy-crochet-beanie", name: "Navy Crochet Beanie", category: "Hats", kind: "ready", price: 13000, checkout: "bag", size: "One size", colour: "Navy", colours: ["Blue"], description: "Navy ribbed beanie with a folded brim.", images: img("navy-crochet-beanie") },
  { slug: "mocha-crochet-beanie", name: "Mocha Crochet Beanie", category: "Hats", kind: "ready", price: 12000, checkout: "bag", size: "One size", colour: "Mocha brown", colours: ["Black"], description: "Mocha brown ribbed beanie with a folded brim.", images: img("mocha-crochet-beanie") },
  { slug: "pink-button-beanie", name: "Pink Button Beanie", category: "Hats", kind: "ready", price: 12000, checkout: "bag", size: "One size", colour: "Pink", colours: ["Pink"], description: "Slouchy pink beanie with button details. Slouch so good, it's basically a personality.", images: img("pink-button-beanie") },
  { slug: "forest-button-beanie", name: "Forest Button Beanie", category: "Hats", kind: "ready", price: 12000, checkout: "bag", size: "One size", colour: "Forest green", colours: ["Green"], description: "Slouchy forest green beanie with button details.", images: img("forest-button-beanie") },
  { slug: "camo-button-beanie", name: "Camo Button Beanie", category: "Hats", kind: "ready", price: 12000, checkout: "bag", size: "One size", colour: "Camo green", colours: ["Green"], description: "Slouchy camo beanie with button details.", images: img("camo-button-beanie") },
  { slug: "brown-button-beanie", name: "Brown Button Beanie", category: "Hats", kind: "made", price: null, checkout: "request", colour: "Brown", colours: ["Black"], description: "Slouchy brown beanie with button details, made in the colour you choose.", images: img("brown-button-beanie") },
  { slug: "black-ribbed-beanie", name: "Black Ribbed Beanie", category: "Hats", kind: "made", price: null, checkout: "request", colour: "Black", colours: ["Black"], description: "Black ribbed beanie with a folded brim. Beanie season, best season.", images: img("black-ribbed-beanie") },
  { slug: "green-ribbed-beanie", name: "Green Ribbed Beanie", category: "Hats", kind: "made", price: null, checkout: "request", colour: "Green, olive and teal", colours: ["Green"], description: "Ribbed beanie in a green, olive and teal yarn.", images: img("green-ribbed-beanie") },
  { slug: "kids-granny-vest", name: "Kids Granny Vest", category: "Tops & knits", kind: "made", price: null, checkout: "request", colour: "Cream with coloured squares", colours: ["Cream"], description: "Granny-square vest for little ones, because every little one deserves something handmade.", images: img("kids-granny-vest", 3) },
  { slug: "mini-pink-crochet-dress", name: "Mini Pink Crochet Dress", category: "Dresses", kind: "made", price: null, checkout: "request", colour: "Pink and white", colours: ["Pink"], description: "Small pink and white crochet dress for little ones.", images: img("mini-pink-crochet-dress") },
  { slug: "rosebud-loom-earrings", name: "Rosebud Loom Earrings", category: "Earrings", kind: "made", price: 8000, checkout: "bag", leadTime: "Made in 3 days", colour: "Magenta", colours: ["Pink"], description: "Magenta double-flower drops with pink bead centres.", images: img("rosebud-loom-earrings") },
  { slug: "noir-loom-earrings", name: "Noir Loom Earrings", category: "Earrings", kind: "made", price: 8000, checkout: "bag", leadTime: "Made in 3 days", colour: "Black", colours: ["Black"], description: "Black crochet flower drops.", images: img("noir-loom-earrings") },
  { slug: "ivory-bloom-loom-earrings", name: "Ivory Bloom Loom Earrings", category: "Earrings", kind: "made", price: 8000, checkout: "bag", leadTime: "Made in 3 days", colour: "Ivory", colours: ["Cream"], description: "Ivory crochet flower studs with a gold centre.", images: img("ivory-bloom-loom-earrings") },
  { slug: "cirqua-loom-earrings", name: "Cirqua Loom Earrings", category: "Earrings", kind: "made", price: 8000, checkout: "bag", leadTime: "Made in 3 days", colour: "Magenta", colours: ["Pink"], description: "Magenta double-hoop drops with gold accents.", images: img("cirqua-loom-earrings") },
  { slug: "blush-muse-floral-earrings", name: "Blush Muse Floral Earrings", category: "Earrings", kind: "made", price: 8000, checkout: "bag", leadTime: "Made in 3 days", colour: "Pink and magenta", colours: ["Pink"], description: "Stacked pink and magenta crochet flowers.", images: img("blush-muse-floral-earrings") },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function categoryCounts() {
  return categories.map((c) => ({ category: c, count: products.filter((p) => p.category === c).length }));
}

export function relatedProducts(product: Product, n = 4) {
  const ready = products.filter((p) => p.slug !== product.slug && p.kind === "ready");
  const same = ready.filter((p) => p.category === product.category);
  return [...same, ...ready.filter((p) => p.category !== product.category)].slice(0, n);
}

/** Display price: "₦40,000", "From ₦70,000" or "Price on request". */
export function priceLabel(p: Pick<Product, "price" | "priceFrom">) {
  if (p.price === null) return "Price on request";
  const n = `₦${p.price.toLocaleString("en-NG")}`;
  return p.priceFrom ? `From ${n}` : n;
}

export function tagLabel(p: Product) {
  if (p.kind === "ready") return "Ready to wear";
  return p.leadTime ?? "Made to order";
}
