import "server-only";
import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { cloudflareHost } from "@/lib/front-door";
import { db } from "@/lib/server/db";

// A small, shared limit on repeated attempts (sign-ins, order lookups, orders, uploads, payments),
// kept in the database so every server instance sees the same count.

/**
 * Whether a request really came through the Cloudflare worker: it carries the secret only the worker and
 * the site know (FRONT_DOOR_KEY here, DOOR_KEY in the worker). Without that secret set, the older check
 * (the worker's address header, which anyone could copy) still applies.
 */
function viaFrontDoor(h: Headers) {
  if (h.get("x-mimi-host") !== cloudflareHost) return false;
  const key = process.env.FRONT_DOOR_KEY;
  if (!key) return true;
  const want = Buffer.from(key);
  const got = Buffer.from(h.get("x-mimi-door") ?? "");
  return want.length === got.length && timingSafeEqual(want, got);
}

/**
 * The visitor's address. Through Cloudflare every request reaches Netlify from Cloudflare, so the worker
 * passes the visitor's own address along (x-mimi-client-ip), trusted only with the worker's secret. Anyone
 * else is counted by the address Netlify itself sees, which can't be faked. Every limit also has an
 * overall cap.
 */
export async function clientIp() {
  const h = await headers();
  const viaCloudflare = viaFrontDoor(h) ? h.get("x-mimi-client-ip") : null;
  return viaCloudflare || h.get("x-nf-client-connection-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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
