// The site's own address, for links that leave the site (share cards, the sitemap, robots.txt):
// NEXT_PUBLIC_SITE_URL once a domain is set, else the host's own address (Netlify's URL, or Vercel's
// production address), else local dev.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NETLIFY === "true" && process.env.CONTEXT !== "production" ? process.env.DEPLOY_PRIME_URL : undefined) ??
  process.env.URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3020");

/**
 * Netlify builds stay out of search engines until go-live (MIMI_LIVE=true in Netlify's settings), so
 * the copy being built there never competes with the site friends are testing. Test builds (branches,
 * previews) always stay out.
 */
export const hiddenFromSearch =
  process.env.NETLIFY === "true" && (process.env.CONTEXT !== "production" || process.env.MIMI_LIVE !== "true");
