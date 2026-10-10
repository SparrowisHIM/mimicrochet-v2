import "server-only";
import webpush from "web-push";
import { db } from "@/lib/server/db";
import { site } from "@/lib/site";

// Notifications on Mimi's phones (her iPhone, once the studio is on its home screen, and her Android)
// when an order needs her: a new request, or a customer saying they've paid. Keys are made once with
// `npm run studio:setup`; the public one is also given to the studio page so phones can subscribe.

export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY ?? "";

let ready = false;
function configure() {
  if (ready) return true;
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(`mailto:${site.email}`, pub, priv);
  ready = true;
  return true;
}

export async function savePushSubscription(s: { endpoint: string; p256dh: string; auth: string; device: string }) {
  await db()`
    insert into push_subscriptions (endpoint, p256dh, auth, device) values (${s.endpoint}, ${s.p256dh}, ${s.auth}, ${s.device})
    on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, device = excluded.device`;
}

/** One notification to one phone (the "it works" ping right after Mimi turns them on). */
export async function pingOne(s: { endpoint: string; p256dh: string; auth: string }, n: { title: string; body: string; url: string }) {
  if (!configure()) return false;
  try {
    await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(n), { TTL: 600, timeout: 4000 });
    return true;
  } catch (e) {
    console.error("push", (e as { statusCode?: number }).statusCode, (e as Error).message);
    return false;
  }
}

export async function removePushSubscription(endpoint: string) {
  await db()`delete from push_subscriptions where endpoint = ${endpoint}`;
}

/**
 * Tells every phone Mimi turned notifications on for. Never throws and never takes long: an order must
 * go through even if a notification can't. Phones that have switched notifications off are forgotten.
 */
export async function notifyMimi(n: { title: string; body: string; url: string; tag?: string }) {
  try {
    if (!configure()) return;
    const subs = await db()`select endpoint, p256dh, auth from push_subscriptions`;
    const payload = JSON.stringify(n);
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86_400, urgency: "high", timeout: 4000 });
          await db()`update push_subscriptions set last_ok_at = now() where endpoint = ${s.endpoint}`;
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) await removePushSubscription(s.endpoint as string);
          else console.error("push", status, (e as Error).message);
        }
      }),
    );
  } catch (e) {
    console.error("notifyMimi", e);
  }
}
