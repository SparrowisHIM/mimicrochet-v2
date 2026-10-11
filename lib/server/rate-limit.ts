import "server-only";
import { headers } from "next/headers";
import { cloudflareHost } from "@/lib/front-door";
import { db } from "@/lib/server/db";

// A small, shared limit on repeated attempts (sign-ins, order lookups, orders, uploads, payments),
// kept in the database so every server instance sees the same count.

/**
 * The visitor's address as Netlify reports it. Through the Cloudflare test link every request reaches
 * Netlify from Cloudflare, so the worker passes the visitor's own address along (x-mimi-client-ip).
 * Someone could fake that header, so every limit also has a cap that doesn't depend on it.
 */
export async function clientIp() {
  const h = await headers();
  const viaCloudflare = h.get("x-mimi-host") === cloudflareHost ? h.get("x-mimi-client-ip") : null;
  return viaCloudflare ?? h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Records one attempt in `bucket` and says whether it's over the limit: more than `max` attempts in the
 * last `minutes`. Old entries are swept as it goes.
 */
export async function overLimit(bucket: string, max: number, minutes: number) {
  const sql = db();
  const [r] = await sql`
    with swept as (delete from rate_events where at < now() - interval '1 day'),
    added as (insert into rate_events (bucket) values (${bucket}))
    select count(*)::int as n from rate_events where bucket = ${bucket} and at > now() - make_interval(mins => ${minutes})`;
  // The count doesn't include the attempt just added (same statement), so compare with >=.
  return (r.n as number) >= max;
}

/**
 * One attempt at `action`. True when it's over a limit: `perVisitor` tries from this address, `perKey`
 * tries at one thing (an order number, say), or `overall` tries from everyone. Each is [tries, minutes].
 */
export async function tooMany(action: string, limits: { perVisitor: [number, number]; overall: [number, number]; perKey?: [string, number, number] }) {
  const ip = await clientIp();
  if (await overLimit(`${action}:${ip}`, ...limits.perVisitor)) return true;
  if (limits.perKey && (await overLimit(`${action}:key:${limits.perKey[0]}`, limits.perKey[1], limits.perKey[2]))) return true;
  return overLimit(`${action}:all`, ...limits.overall);
}
