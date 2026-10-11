"use server";

import { parseCustomOrder } from "@/lib/server/order-input";
import { codeForOrder, createCustomOrder, markSent } from "@/lib/server/orders";
import { pieceStatus, settlePayment, startOrderPayment, startShopCheckout } from "@/lib/server/payments";
import { deliver } from "@/lib/server/studio";
import { notifyMimi } from "@/lib/server/push";
import { tooMany } from "@/lib/server/rate-limit";

// What the order pages can ask the server to do. Each one checks its own input (anyone can post
// here directly), stops repeated tries past a limit no real customer reaches, and answers with only
// what the page needs.

const slowDown = "Too many tries in a short time. Wait a few minutes and try again, or message Mimi on WhatsApp.";

export async function submitCustomOrder(input: unknown) {
  const parsed = parseCustomOrder(input);
  if (!parsed.ok) return { ok: false as const, error: parsed.error };
  if (await tooMany("order", { perVisitor: [6, 60], overall: [80, 60] })) return { ok: false as const, error: slowDown };
  try {
    return { ok: true as const, ...(await createCustomOrder(parsed.order)) };
  } catch (e) {
    console.error("submitCustomOrder", e);
    return { ok: false as const, error: "Couldn't save the order." };
  }
}

/** The tracking code for an order number plus the last 4 digits of its phone number, or null. */
export async function findOrderCode(number: unknown, last4: unknown) {
  if (typeof number !== "string" || typeof last4 !== "string" || number.length > 20) return null;
  try {
    // Guessing the 4 digits takes up to 10,000 tries, so each order number gets only a few an hour.
    if (await tooMany("lookup", { perVisitor: [10, 15], perKey: [number.replace(/\D/g, ""), 15, 60], overall: [300, 15] })) return null;
    return await codeForOrder(number, last4);
  } catch (e) {
    console.error("findOrderCode", e);
    return null;
  }
}

export async function confirmSent(code: unknown) {
  if (typeof code !== "string") return false;
  try {
    if (await tooMany("sent", { perVisitor: [10, 60], overall: [120, 60] })) return false;
    const o = await markSent(code);
    if (o) await notifyMimi({ title: `New request from ${o.name}`, body: `${o.piece} · ${o.number}`, url: "/studio", tag: o.number });
    return Boolean(o);
  } catch (e) {
    console.error("confirmSent", e);
    return false;
  }
}

/* --------------------------------- Paystack --------------------------------- */

/** "Pay" on a custom order's page: the deposit, the full price or the balance. Answers with Paystack's page. */
export async function payForOrder(code: unknown, purpose: unknown, email: unknown) {
  if (typeof code !== "string" || (purpose !== "deposit" && purpose !== "full" && purpose !== "balance")) return { ok: false as const, error: "Something went wrong. Reload the page." };
  try {
    if (await tooMany("pay", { perVisitor: [10, 10], overall: [300, 10] })) return { ok: false as const, error: slowDown };
    return await startOrderPayment(code, purpose, typeof email === "string" ? email : null);
  } catch (e) {
    console.error("payForOrder", e);
    return { ok: false as const, error: "Couldn’t start the payment. Try again in a moment." };
  }
}

/** "Pay" at checkout: the pieces in the bag and where to deliver them. Answers with Paystack's page. */
export async function payForBag(input: unknown) {
  try {
    if (await tooMany("pay", { perVisitor: [10, 10], overall: [300, 10] })) return { ok: false as const, error: slowDown };
    return await startShopCheckout(input);
  } catch (e) {
    console.error("payForBag", e);
    return { ok: false as const, error: "Couldn’t start the payment. Try again in a moment." };
  }
}

/** Which one-of-one pieces have sold or are being paid for, so pages can say so. */
export async function stockFor(slugs: unknown) {
  if (!Array.isArray(slugs)) return { sold: [], held: [] };
  try {
    return await pieceStatus(slugs.filter((s): s is string => typeof s === "string"));
  } catch (e) {
    console.error("stockFor", e);
    return { sold: [], held: [] };
  }
}

/** Back from Paystack while it was still confirming: ask again (the page polls this for a minute). */
export async function checkPayment(reference: unknown) {
  if (typeof reference !== "string") return "unknown" as const;
  try {
    // Each check asks Paystack, so a page left open can't hammer it (it polls every 5s for a minute).
    if (await tooMany("check", { perVisitor: [40, 10], overall: [600, 10] })) return "pending" as const;
    return await settlePayment(reference);
  } catch (e) {
    console.error("checkPayment", e);
    return "pending" as const;
  }
}

/** "I've received it" on the customer's page: the order is delivered, and Mimi's phone hears about it. */
export async function confirmReceived(code: unknown) {
  if (typeof code !== "string") return false;
  try {
    if (await tooMany("received", { perVisitor: [10, 60], overall: [120, 60] })) return false;
    const o = await deliver(code, "Received. Enjoy wearing it!");
    if (o) await notifyMimi({ title: `${o.name} got their order`, body: `${o.number} arrived. They tapped “I’ve received it”.`, url: "/studio", tag: o.number });
    return Boolean(o);
  } catch (e) {
    console.error("confirmReceived", e);
    return false;
  }
}
