import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";
// Vercel preview deployments show Vercel's feedback toolbar, which loads from vercel.live.
const preview = process.env.VERCEL_ENV === "preview";
const toolbar = preview ? " https://vercel.live" : "";

/**
 * What the browser may load and run on this site. Everything comes from the site itself: no outside
 * scripts, no embedding the site in someone else's frame, no plugins, and forms can only submit here.
 * 'unsafe-inline' scripts are needed by Next.js without per-request nonces (which would make every
 * page dynamic); the site has no place where visitor text becomes HTML, so there's nothing to inject into.
 * 'unsafe-eval' is for the iPhone photo converter (heic2any), which builds code at runtime. It has to be
 * site-wide, because these rules come with the first page a visitor opens and stay as they move around.
 * Drop it once the server converts iPhone photos instead (see notes.md, "Security").
 */
function contentSecurityPolicy() {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'${toolbar}`,
    `style-src 'self' 'unsafe-inline'${toolbar}`,
    `img-src 'self' data: blob:${preview ? " https://vercel.live https://vercel.com" : ""}`,
    "media-src 'self' blob:",
    `font-src 'self'${preview ? " https://vercel.live https://assets.vercel.com" : ""}`,
    `connect-src 'self'${dev ? " ws:" : ""}${preview ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
    "worker-src 'self' blob:",
    `frame-src ${preview ? "https://vercel.live" : "'none'"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  // Files are only ever treated as the type the server says they are.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites only learn that a visitor came from this site, never the page (tracking links stay private).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // No one can show the site inside their own page to trick visitors into tapping things.
  { key: "X-Frame-Options", value: "DENY" },
  // The microphone is for voice notes on this site only; nothing else is ever asked for.
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ...(dev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Private pages: order tracking links and Mimi's own page stay out of search engines.
      { source: "/t/:code*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/studio", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
