import "server-only";
import { cloudflareHost } from "@/lib/front-door";

/**
 * Only this site's own pages may post files (server actions get the same check from Next.js). A post
 * counts as ours when it comes from the address it was sent to, or from the Cloudflare test link,
 * which passes requests on to Netlify under Netlify's own address.
 */
export function fromThisSite(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const from = new URL(origin).host;
  return from === request.headers.get("host") || from === cloudflareHost;
}
