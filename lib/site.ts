// Real contact details from v1 (lib/socials.ts, lib/site.ts). Never invent these.
export const site = {
  /** The wordmark, in capitals as on the logo (header, footer). */
  name: "MIMICROCHET.NG",
  /** How the site is named outside the page: browser tabs, link previews, home screens. Written like other
   *  sites' tab names (capital first letters), because the all-caps wordmark looks loud in a tab. */
  shortName: "Mimi Crochet",
  description:
    "Handmade crochet from Port Harcourt. Shop one-of-one pieces, order your own, and follow it from the first stitch to your door.",
  email: "Miracleemenike50@yahoo.com",
  whatsappNumber: "2349157669182",
  socials: {
    instagram: "https://www.instagram.com/mimicrochet.ng",
    whatsapp: "https://wa.me/2349157669182",
    tiktok: "https://www.tiktok.com/@mimicrochet.ng",
    facebook: "https://www.facebook.com/share/1DuVXi2h7x/",
    pinterest: "https://pin.it/1qFPQb6Ru",
  },
} as const;

/** wa.me link with a prefilled message (wa.link short links drop ?text=). */
export function whatsappLink(message?: string) {
  const base = `https://wa.me/${site.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/custom-order", label: "Custom orders" },
  { href: "/track", label: "Track an order" },
  { href: "/about", label: "About" },
] as const;

export const footerLinks = {
  shop: [
    { href: "/shop", label: "Shop" },
    { href: "/custom-order", label: "Custom orders" },
    { href: "/track", label: "Track an order" },
  ],
  studio: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  social: [
    { href: site.socials.instagram, label: "Instagram" },
    { href: site.socials.whatsapp, label: "WhatsApp" },
    { href: site.socials.tiktok, label: "TikTok" },
    { href: site.socials.facebook, label: "Facebook" },
    { href: site.socials.pinterest, label: "Pinterest" },
  ],
} as const;

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}
