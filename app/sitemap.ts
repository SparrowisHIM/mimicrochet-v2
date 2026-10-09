import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { siteUrl } from "@/lib/site-url";

// Every page people should find on Google, and every piece with its photos (an image sitemap, so the
// pieces can show up in image search too). Private pages (checkout, saved, tracking links, Mimi's
// orders) are left out; they also carry noindex. No dates: the pieces have none yet, and a date that
// changes on every build tells Google nothing.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/shop", "/custom-order", "/about", "/contact", "/track"].map((path) => ({ url: `${siteUrl}${path}` }));
  const pieces = products.map((p) => ({
    url: `${siteUrl}/shop/${p.slug}`,
    images: p.images.map((src) => `${siteUrl}${src}`),
  }));
  return [...pages, ...pieces];
}
