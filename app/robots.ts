import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Crawlers may read everything except Mimi's own orders page. Tracking links stay readable so WhatsApp
// can still show their share card; they (and checkout and saved) are kept out of search by noindex.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/studio" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
