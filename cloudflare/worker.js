// Cloudflare in front of the Netlify test site, until the domain exists.
//
// Netlify's free plan serves the site from Frankfurt, and from Nigeria that route is slow (small files
// taking 15-20 seconds). Cloudflare has servers near Nigeria and a fast network to Netlify, so every
// request goes through it instead; the site's code and photos are also kept at Cloudflare where it
// allows, so they arrive in a second. Pages, orders, payments and the studio always come fresh from Netlify.

const ORIGIN = "https://feat-backend--mimicrochetng.netlify.app";

/** How long Cloudflare may keep a file (seconds): Next's code never changes under the same name; photos only with a deploy. */
function keepFor(path) {
  if (path.startsWith("/_next/static/")) return 31536000;
  if (path.startsWith("/_next/image") || path.startsWith("/images/")) return 86400;
  if (/\.(?:png|jpe?g|webp|avif|svg|ico|woff2?)$/.test(path)) return 86400;
  return 0;
}

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, ORIGIN);
    const headers = new Headers(request.headers);
    // The site builds its own links (Paystack's return trip) from this, so customers stay on this address.
    headers.set("x-mimi-host", url.host);
    headers.delete("host");

    const ttl = request.method === "GET" ? keepFor(url.pathname) : 0;
    if (!ttl) {
      const res = await fetch(target, { method: request.method, headers, body: request.body, redirect: "manual" });
      return withOwnAddress(res, url);
    }

    // Photos come back as AVIF or WebP depending on the browser: one copy of each.
    const accept = request.headers.get("accept") ?? "";
    const format = url.pathname.startsWith("/_next/image") ? (accept.includes("image/avif") ? "avif" : accept.includes("image/webp") ? "webp" : "jpg") : "any";
    const key = new Request(`${url.origin}${url.pathname}${url.search}${url.search ? "&" : "?"}__f=${format}`);
    const cache = caches.default;
    const kept = await cache.match(key);
    if (kept) return tag(kept, "hit");

    const res = await fetch(target, { headers, cf: { cacheEverything: true, cacheTtl: ttl } });
    if (!res.ok) return tag(res, "miss");
    const out = new Response(res.body, res);
    out.headers.set("Cache-Control", `public, max-age=${ttl}${ttl > 86400 ? ", immutable" : ""}`);
    ctx.waitUntil(cache.put(key, out.clone()));
    return tag(out, "miss");
  },
};

export default worker;

function tag(res, state) {
  const out = new Response(res.body, res);
  out.headers.set("x-mimi-cache", state);
  return out;
}

/** Netlify's redirects name Netlify's address: point them back here. */
function withOwnAddress(res, url) {
  const loc = res.headers.get("location");
  if (!loc || !loc.startsWith(ORIGIN)) return res;
  const out = new Response(res.body, res);
  out.headers.set("location", url.origin + loc.slice(ORIGIN.length));
  return out;
}
