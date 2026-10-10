// The site's own address, for links that leave the site (share cards, the sitemap, robots.txt):
// NEXT_PUBLIC_SITE_URL once a domain is set, else the host's own address (Netlify's URL, or Vercel's
// production address), else local dev.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NETLIFY === "true" && process.env.CONTEXT !== "production" ? process.env.DEPLOY_PRIME_URL : undefined) ??
  process.env.URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3020");

/** A Netlify test build (a branch or preview, not the live site): kept out of search engines. */
export const isTestBuild = process.env.NETLIFY === "true" && process.env.CONTEXT !== "production";
