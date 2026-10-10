import type { MetadataRoute } from "next";
import { hiddenFromSearch, siteUrl } from "@/lib/site-url";

// Crawlers may read everything except Mimi's own orders page. Tracking links stay readable so WhatsApp
// can still show their share card; they (and checkout and saved) are kept out of search by noindex.
// Netlify builds before go-live are kept out of search entirely (see lib/site-url.ts).
export default function robots(): MetadataRoute.Robots {
  if (hiddenFromSearch) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/studio" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
