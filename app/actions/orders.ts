"use server";

import { parseCustomOrder } from "@/lib/server/order-input";
import { codeForOrder, createCustomOrder, markSent } from "@/lib/server/orders";
import { pieceStatus, settlePayment, startOrderPayment, startShopCheckout } from "@/lib/server/payments";
import { deliver } from "@/lib/server/studio";
import { notifyMimi } from "@/lib/server/push";

// What the order pages can ask the server to do. Each one checks its own input (anyone can post
// here directly) and answers with only what the page needs.

export async function submitCustomOrder(input: unknown) {
  const parsed = parseCustomOrder(input);
  if (!parsed.ok) return { ok: false as const, error: parsed.error };
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
    return await codeForOrder(number, last4);
  } catch (e) {
    console.error("findOrderCode", e);
    return null;
  }
}

export async function confirmSent(code: unknown) {
  if (typeof code !== "string") return false;
  try {
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
    return await startOrderPayment(code, purpose, typeof email === "string" ? email : null);
  } catch (e) {
    console.error("payForOrder", e);
    return { ok: false as const, error: "Couldn’t start the payment. Try again in a moment." };
  }
}

/** "Pay" at checkout: the pieces in the bag and where to deliver them. Answers with Paystack's page. */
export async function payForBag(input: unknown) {
  try {
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
    const o = await deliver(code, "Received. Enjoy wearing it!");
    if (o) await notifyMimi({ title: `${o.name} got their order`, body: `${o.number} arrived. They tapped “I’ve received it”.`, url: "/studio", tag: o.number });
    return Boolean(o);
  } catch (e) {
    console.error("confirmReceived", e);
    return false;
  }
}
