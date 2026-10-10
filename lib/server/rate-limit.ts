import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/server/db";

// A small, shared limit on repeated attempts (sign-in tries, and later order lookups and uploads),
// kept in the database so every server instance sees the same count.

/** The visitor's address as Netlify reports it (falls back to the first forwarded address). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
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
