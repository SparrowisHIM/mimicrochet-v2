import type { MetadataRoute } from "next";
import { isTestBuild, siteUrl } from "@/lib/site-url";

// Crawlers may read everything except Mimi's own orders page. Tracking links stay readable so WhatsApp
// can still show their share card; they (and checkout and saved) are kept out of search by noindex.
// A Netlify test build is kept out of search entirely, so only the live site is ever listed.
export default function robots(): MetadataRoute.Robots {
  if (isTestBuild) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/studio" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
