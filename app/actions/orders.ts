"use server";

import { parseCustomOrder } from "@/lib/server/order-input";
import { codeForOrder, createCustomOrder, markSent, reportPayment } from "@/lib/server/orders";
import { notifyMimi } from "@/lib/server/push";
import { depositOf } from "@/lib/order-code";
import { formatNaira } from "@/lib/site";

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

export async function confirmPaymentSent(code: unknown, which: unknown) {
  if (typeof code !== "string" || (which !== "deposit" && which !== "full")) return false;
  try {
    const o = await reportPayment(code, which);
    if (o) {
      const amount = formatNaira(which === "full" ? o.price : depositOf(o.price));
      await notifyMimi({ title: `${o.name} says they’ve paid`, body: `${amount} (${which === "full" ? "the full price" : "the deposit"}) for ${o.number}. Check your bank app.`, url: "/studio", tag: o.number });
    }
    return Boolean(o);
  } catch (e) {
    console.error("confirmPaymentSent", e);
    return false;
  }
}
