// The site's own address, for links that leave the site (share cards, the sitemap, robots.txt):
// NEXT_PUBLIC_SITE_URL once a domain is set, else Vercel's production address, else local dev.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3020");
