import type { MetadataRoute } from "next";
import { hiddenFromSearch, siteUrl } from "@/lib/site-url";

// Crawlers may read everything except Mimi's own orders page. Tracking links stay readable so WhatsApp
// can still show their share card; they (and checkout and saved) are kept out of search by noindex.
export default function robots(): MetadataRoute.Robots {
  // The Vercel copy has no sitemap: every page says noindex (next.config.ts), the real shop has the sitemap.
  if (hiddenFromSearch) return { rules: { userAgent: "*", allow: "/", disallow: "/studio" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/studio" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
