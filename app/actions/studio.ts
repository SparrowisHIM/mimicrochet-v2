"use server";

import { pingOne, removePushSubscription, savePushSubscription } from "@/lib/server/push";
import { clientIp, overLimit } from "@/lib/server/rate-limit";
import { endSession, isStudio, passwordMatches, startSession, studioReady } from "@/lib/server/session";
import { confirmPayment, markDelivered, markReady, setPrice } from "@/lib/server/studio";

// What Mimi's studio can ask the server to do. Sign-in is the only action open to anyone (and is
// limited); every other one checks the studio session first and answers only true or false.

export async function signIn(password: unknown) {
  if (!studioReady()) return { ok: false as const, error: "Sign-in isn’t set up on this site yet." };
  const ip = await clientIp();
  // 8 tries per phone per 15 minutes, 40 in total: a guessing script gets nowhere.
  if ((await overLimit(`signin:${ip}`, 8, 15)) || (await overLimit("signin:all", 40, 15)))
    return { ok: false as const, error: "Too many tries. Wait 15 minutes, then try again." };
  if (typeof password !== "string" || !(await passwordMatches(password))) return { ok: false as const, error: "That isn’t the password." };
  await startSession();
  return { ok: true as const };
}

export async function signOut() {
  await endSession();
}

async function asMimi(run: () => Promise<boolean>) {
  if (!(await isStudio())) return false;
  try {
    return await run();
  } catch (e) {
    console.error("studio action", e);
    return false;
  }
}

export async function studioSetPrice(code: unknown, total: unknown, readyOn: unknown) {
  return asMimi(async () => typeof code === "string" && typeof total === "number" && typeof readyOn === "string" && setPrice(code, total, readyOn));
}

export async function studioConfirmPayment(code: unknown, full: unknown) {
  return asMimi(async () => typeof code === "string" && confirmPayment(code, full === true));
}

export async function studioMarkReady(code: unknown) {
  return asMimi(async () => typeof code === "string" && markReady(code));
}

export async function studioMarkDelivered(code: unknown) {
  return asMimi(async () => typeof code === "string" && markDelivered(code));
}

/** Turns notifications on for this phone; `first` sends a ping straight away so Mimi sees it works. */
export async function studioSubscribe(sub: unknown, device: unknown, first?: unknown) {
  return asMimi(async () => {
    const s = sub as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
    const endpoint = s?.endpoint, p256dh = s?.keys?.p256dh, auth = s?.keys?.auth;
    if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || endpoint.length > 1000 || typeof p256dh !== "string" || typeof auth !== "string") return false;
    const kind = device === "iPhone" || device === "Android" ? device : "Computer";
    const saved = { endpoint, p256dh: p256dh.slice(0, 200), auth: auth.slice(0, 100) };
    await savePushSubscription({ ...saved, device: kind });
    if (first === true) await pingOne(saved, { title: "Notifications are on", body: "You’ll get one here for each new order, and when someone says they’ve paid.", url: "/studio" });
    return true;
  });
}

export async function studioUnsubscribe(endpoint: unknown) {
  return asMimi(async () => {
    if (typeof endpoint !== "string") return false;
    await removePushSubscription(endpoint);
    return true;
  });
}
