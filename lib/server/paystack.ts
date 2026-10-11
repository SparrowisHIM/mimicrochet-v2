import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Paystack, server side only. The customer is sent to Paystack's own checkout page (card, bank transfer,
// USSD) and comes back to their order page; nothing from Paystack runs on the site. Every payment is
// checked here with Paystack before anything is marked paid. Mimi's subaccount takes the whole payment,
// and Paystack's fee comes out of her share (bearer: subaccount), so the site's main account keeps nothing.
// API: POST /transaction/initialize, GET /transaction/verify/:reference (amounts in kobo).

const api = "https://api.paystack.co";
const secret = () => process.env.PAYSTACK_SECRET_KEY ?? "";

/** Both settings are in place (Netlify's settings, or .env.local on this computer). */
export const paystackReady = () => /^sk_(test|live)_/.test(secret()) && /^ACCT_/.test(process.env.PAYSTACK_SUBACCOUNT ?? "");

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${api}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const body = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !body?.status || !body.data) throw new Error(`Paystack ${path}: ${res.status} ${body?.message ?? ""}`.trim());
  return body.data;
}

/** Starts a payment and returns Paystack's checkout page for it. */
export async function startPaystack(p: { email: string; naira: number; reference: string; callbackUrl: string; cancelUrl: string; metadata: Record<string, string> }) {
  const data = await call<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: p.email,
      amount: p.naira * 100,
      currency: "NGN",
      reference: p.reference,
      callback_url: p.callbackUrl,
      channels: ["card", "bank_transfer", "ussd", "bank"],
      subaccount: process.env.PAYSTACK_SUBACCOUNT,
      bearer: "subaccount",
      // cancel_action: where Paystack's "Cancel payment" sends them.
      metadata: { ...p.metadata, cancel_action: p.cancelUrl },
    }),
  });
  return data.authorization_url;
}

export type Verified = { paid: boolean; failed: boolean; kobo: number; currency: string; channel: string | null };

/** What Paystack says about a payment. `paid` only for a finished, successful charge. `kobo` is the amount the
 *  site asked for: when the account passes Paystack's fee on to customers, `amount` also includes the fee, and
 *  `requested_amount` is the original. */
export async function verifyPaystack(reference: string): Promise<Verified> {
  const d = await call<{ status: string; amount: number; requested_amount?: number; currency: string; reference: string; channel?: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  if (d.reference !== reference) throw new Error("Paystack answered for another payment");
  return { paid: d.status === "success", failed: d.status === "failed" || d.status === "reversed", kobo: d.requested_amount ?? d.amount, currency: d.currency, channel: d.channel ?? null };
}

/** Paystack signs each webhook with the secret key (HMAC-SHA512 of the raw body, hex). */
export function webhookIsFromPaystack(rawBody: string, signature: string | null) {
  if (!signature || !secret()) return false;
  const expected = Buffer.from(createHmac("sha512", secret()).update(rawBody).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
