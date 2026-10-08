// Concept pictures and references for custom orders. These are NOT Mimi's finished work:
// they're always labelled as ideas, and ordering one starts a custom request.

export const ideaCategories = ["Sets & shorts", "Dresses", "Shirts", "Tops & knits", "Hats", "Bags"] as const;
export type IdeaCategory = (typeof ideaCategories)[number];

export type Idea = {
  slug: string;
  name: string;
  category: IdeaCategory;
  /** Rough starting price from v1, or null when Mimi quotes it. */
  priceFrom: number | null;
  occasion: ("Beach" | "Party" | "Everyday" | "Wedding guest")[];
  image: string;
};

const i = (slug: string) => `/images/ideas/${slug}.jpg`;

export const ideas: Idea[] = [
  { slug: "daisy-ruffle-crochet-set", name: "Daisy Ruffle Set", category: "Sets & shorts", priceFrom: 35000, occasion: ["Beach", "Party"], image: i("daisy-ruffle-crochet-set") },
  { slug: "carnival-granny-crochet-shirt", name: "Carnival Granny Shirt", category: "Shirts", priceFrom: 80000, occasion: ["Everyday", "Party"], image: i("carnival-granny-crochet-shirt") },
  { slug: "azure-bloom-granny-bucket-hat", name: "Azure Bloom Bucket Hat", category: "Hats", priceFrom: 12000, occasion: ["Beach", "Everyday"], image: i("azure-bloom-granny-bucket-hat") },
  { slug: "granny-bloom-midi-dress", name: "Granny Bloom Midi Dress", category: "Dresses", priceFrom: 45000, occasion: ["Party", "Wedding guest"], image: i("granny-bloom-midi-dress") },
  { slug: "blush-garden-crochet-shoulder-bag", name: "Blush Garden Shoulder Bag", category: "Bags", priceFrom: null, occasion: ["Party", "Wedding guest"], image: i("blush-garden-crochet-shoulder-bag") },
  { slug: "pastel-bloom-beach-set", name: "Pastel Bloom Beach Set", category: "Sets & shorts", priceFrom: 35000, occasion: ["Beach"], image: i("pastel-bloom-beach-set") },
  { slug: "candy-lace-crochet-set", name: "Candy Lace Set", category: "Sets & shorts", priceFrom: 35000, occasion: ["Beach", "Party"], image: i("candy-lace-crochet-set") },
  { slug: "ocean-wave-crochet-shirt", name: "Ocean Wave Shirt", category: "Shirts", priceFrom: 80000, occasion: ["Everyday", "Beach"], image: i("ocean-wave-crochet-shirt") },
  { slug: "ruby-mesh-crochet-dress", name: "Ruby Mesh Dress", category: "Dresses", priceFrom: 45000, occasion: ["Party"], image: i("ruby-mesh-crochet-dress") },
  { slug: "ayo-floral-crochet-tote", name: "Ayo Floral Tote", category: "Bags", priceFrom: null, occasion: ["Everyday"], image: i("ayo-floral-crochet-tote") },
  { slug: "rose-garden-granny-bucket-hat", name: "Rose Garden Bucket Hat", category: "Hats", priceFrom: 12000, occasion: ["Beach", "Everyday"], image: i("rose-garden-granny-bucket-hat") },
  { slug: "garden-granny-coord-set", name: "Garden Granny Co-ord", category: "Sets & shorts", priceFrom: 35000, occasion: ["Party", "Everyday"], image: i("garden-granny-coord-set") },
  { slug: "summer-bloom-crochet-shirt", name: "Summer Bloom Shirt", category: "Shirts", priceFrom: 80000, occasion: ["Beach", "Everyday"], image: i("summer-bloom-crochet-shirt") },
  { slug: "floral-garden-crochet-dress", name: "Floral Garden Dress", category: "Dresses", priceFrom: 45000, occasion: ["Wedding guest", "Party"], image: i("floral-garden-crochet-dress") },
  { slug: "purple-cloud-crop-sweater", name: "Purple Cloud Crop Sweater", category: "Tops & knits", priceFrom: 50000, occasion: ["Everyday"], image: i("purple-cloud-crop-sweater") },
  { slug: "aqua-crochet-two-piece-set", name: "Aqua Two-Piece Set", category: "Sets & shorts", priceFrom: 35000, occasion: ["Beach"], image: i("aqua-crochet-two-piece-set") },
  { slug: "noir-stripe-crochet-shirt", name: "Noir Stripe Shirt", category: "Shirts", priceFrom: 80000, occasion: ["Everyday"], image: i("noir-stripe-crochet-shirt") },
  { slug: "sage-border-crochet-dress", name: "Sage Border Dress", category: "Dresses", priceFrom: 45000, occasion: ["Wedding guest", "Everyday"], image: i("sage-border-crochet-dress") },
  { slug: "olive-lace-crochet-tote", name: "Olive Lace Tote", category: "Bags", priceFrom: null, occasion: ["Everyday", "Beach"], image: i("olive-lace-crochet-tote") },
  { slug: "coral-stripe-crochet-set", name: "Coral Stripe Set", category: "Sets & shorts", priceFrom: 35000, occasion: ["Beach", "Everyday"], image: i("coral-stripe-crochet-set") },
  { slug: "emerald-granny-crop-sweater", name: "Emerald Granny Crop Sweater", category: "Tops & knits", priceFrom: 50000, occasion: ["Everyday", "Party"], image: i("emerald-granny-crop-sweater") },
  { slug: "pastel-mesh-crochet-shirt", name: "Pastel Mesh Shirt", category: "Shirts", priceFrom: 80000, occasion: ["Beach", "Party"], image: i("pastel-mesh-crochet-shirt") },
  { slug: "rainbow-lace-crochet-dress", name: "Rainbow Lace Dress", category: "Dresses", priceFrom: 45000, occasion: ["Party", "Beach"], image: i("rainbow-lace-crochet-dress") },
  { slug: "lavender-stripe-crochet-set", name: "Lavender Stripe Set", category: "Sets & shorts", priceFrom: 35000, occasion: ["Beach", "Everyday"], image: i("lavender-stripe-crochet-set") },
  { slug: "olive-stripe-crochet-shirt", name: "Olive Stripe Shirt", category: "Shirts", priceFrom: 80000, occasion: ["Everyday"], image: i("olive-stripe-crochet-shirt") },
  { slug: "ivory-crochet-skirt-set", name: "Ivory Column Set", category: "Sets & shorts", priceFrom: 35000, occasion: ["Wedding guest", "Party"], image: i("ivory-crochet-skirt-set") },
  { slug: "olive-bloom-crochet-shirt-custom", name: "Green Granny Shirt", category: "Shirts", priceFrom: 80000, occasion: ["Everyday"], image: i("olive-bloom-crochet-shirt-custom") },
  { slug: "blush-stripe-crochet-shirt", name: "Blush Stripe Shirt", category: "Shirts", priceFrom: 80000, occasion: ["Everyday"], image: i("blush-stripe-crochet-shirt") },
  { slug: "sunshine-mini-dress", name: "Golden Halter Dress", category: "Dresses", priceFrom: 45000, occasion: ["Party", "Beach"], image: i("sunshine-mini-dress") },
  { slug: "camo-button-crochet-beanie", name: "Moss Granny Beanie", category: "Hats", priceFrom: 12000, occasion: ["Everyday"], image: i("camo-button-crochet-beanie") },
  { slug: "monochrome-park-shirt", name: "Monochrome Granny Shirt", category: "Shirts", priceFrom: 80000, occasion: ["Everyday"], image: i("monochrome-park-shirt") },
];

export const occasions = ["Beach", "Party", "Everyday", "Wedding guest"] as const;

export function getIdea(slug: string) {
  return ideas.find((x) => x.slug === slug);
}

/** A Pinterest search that always starts with "crochet". */
export function pinterestSearch(words: string) {
  const q = `crochet ${words.replace(/^crochet\s+/i, "")}`.trim();
  return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`;
}
