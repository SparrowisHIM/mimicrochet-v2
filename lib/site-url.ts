// The site's own address, for links that leave the site (share cards, the sitemap, robots.txt):
// NEXT_PUBLIC_SITE_URL once a domain is set, else Vercel's production address, else local dev.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3020");

/**
 * This branch is the front-end showcase on Vercel (Efe's portfolio shows it in a frame). The real shop runs on
 * Netlify from feat/backend, so search engines are told to list that one, never this copy. Crawlers may still
 * read the pages, so link previews on X and WhatsApp keep working.
 */
export const hiddenFromSearch = process.env.VERCEL === "1";
