import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { db } from "@/lib/server/db";
import { paystackReady, startPaystack, verifyPaystack } from "@/lib/server/paystack";
import { notifyMimi } from "@/lib/server/push";
import { isLgaOf, isNigerianState } from "@/lib/nigeria";
import { depositOf, isOrderCode, makeCode } from "@/lib/order-code";
import { getProduct } from "@/lib/products";
import { formatNaira } from "@/lib/site";
import { siteUrl } from "@/lib/site-url";
import { fullPhone, hasWords, isEmail, isName, phoneDigits, phoneProblem } from "@/lib/validate";

// Payments, from "Pay" to paid. Amounts always come from the server's own records (the price Mimi set,
// the shop's price list), never from the page. A payment is marked paid only after Paystack confirms it,
// and only once: the first of the return trip and the webhook to get there does the work, in one SQL
// statement, so a payment can never be counted twice.

export type OrderPurpose = "deposit" | "full" | "balance";
type Started = { ok: true; url: string } | { ok: false; error: string; field?: "email"; unavailable?: { slug: string; sold: boolean }[] };

const notReady: Started = { ok: false, error: "Payments aren’t switched on yet. Mimi can take it on WhatsApp." };
const moved: Started = { ok: false, error: "This order has moved on since the page opened. Reload it to see where it is." };
/** Letters, digits and dashes only (what Paystack accepts), tagged with what it pays for. */
const newReference = (tag: string) => `${tag}-${randomBytes(9).toString("base64url").replace(/_/g, "x")}`;
const isReference = (r: string) => /^[A-Za-z0-9.=-]{8,64}$/.test(r);

/** Pay for a custom order: the 60% deposit or the full price once Mimi has set it, or the 40% balance when it's ready. */
export async function startOrderPayment(code: string, purpose: OrderPurpose, emailInput: string | null): Promise<Started> {
  if (!paystackReady()) return notReady;
  if (!isOrderCode(code)) return moved;
  const [o] = await db()`select id, number, kind, stage, price, email, deposit_paid, paid_in_full, balance_paid from orders where code = ${code}`;
  if (!o || o.kind !== "custom" || !o.price) return moved;
  const email = (emailInput ?? (o.email as string | null) ?? "").trim().toLowerCase();
  if (!isEmail(email) || email.length > 120) return { ok: false, error: "Add the email for your receipt.", field: "email" };

  const price = o.price as number;
  let naira: number;
  if (purpose === "balance") {
    if (o.stage !== 3 || !o.deposit_paid || o.paid_in_full || o.balance_paid) return moved;
    naira = price - depositOf(price);
  } else {
    if (o.stage !== 1 || o.deposit_paid) return moved;
    naira = purpose === "full" ? price : depositOf(price);
  }

  const reference = newReference(`${(o.number as string).replace("-", "").toLowerCase()}-${purpose[0]}`);
  await db().transaction((sql) => [
    sql`insert into payments (reference, purpose, order_id, order_code, amount, email) values (${reference}, ${purpose}, ${o.id}, ${code}, ${naira}, ${email})`,
    sql`update orders set email = ${email}, updated_at = now() where id = ${o.id}`,
  ]);
  try {
    const url = await startPaystack({ email, naira, reference, callbackUrl: `${siteUrl}/t/${code}`, cancelUrl: `${siteUrl}/t/${code}`, metadata: { order: o.number as string, purpose } });
    return { ok: true, url };
  } catch (e) {
    console.error("startOrderPayment", e);
    await db()`update payments set status = 'failed' where reference = ${reference}`;
    return { ok: false, error: "Paystack didn’t answer. Try again in a moment." };
  }
}

/* --------------------------------- the shop --------------------------------- */

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Pay for the pieces in the bag. Prices come from the shop's own list; one-of-one pieces are held for 15
 * minutes so no one else can buy them while this customer is on Paystack. The order itself is only made
 * once the payment is confirmed (see settlePayment), under a tracking code chosen now.
 */
export async function startShopCheckout(input: unknown): Promise<Started> {
  if (!paystackReady()) return notReady;
  const i = (input ?? {}) as Record<string, unknown>;
  const name = text(i.name, 60), phone = text(i.phone, 30), email = text(i.email, 120).toLowerCase();
  const state = text(i.state, 40), area = text(i.area, 60), town = text(i.town, 60), address = text(i.address, 160), note = text(i.note, 200);
  const digits = phoneDigits(phone);
  if (!isName(name) || phoneProblem(phone) || !isEmail(email) || !isNigerianState(state) || !isLgaOf(state, area) || !hasWords(address, 6))
    return { ok: false, error: "Some details are missing. Check the form and try again." };

  const slugs = Array.isArray(i.items) ? [...new Set(i.items.filter((s): s is string => typeof s === "string"))].slice(0, 10) : [];
  const pieces = slugs.map((s) => getProduct(s)).filter((p) => p && p.checkout === "bag" && p.price);
  if (!pieces.length || pieces.length !== slugs.length) return { ok: false, error: "Something in your bag can’t be bought online any more. Open your bag to check it." };

  const code = makeCode(randomInt);
  const reference = newReference("shop");
  const oneOfOnes = pieces.filter((p) => p!.kind === "ready").map((p) => p!.slug);
  if (oneOfOnes.length) {
    const held = await db()`
      insert into piece_stock (slug, held_until, held_by)
      select s, now() + interval '15 minutes', ${reference} from unnest(${oneOfOnes}::text[]) as s
      on conflict (slug) do update set held_until = excluded.held_until, held_by = excluded.held_by
        where piece_stock.sold_at is null and (piece_stock.held_until is null or piece_stock.held_until < now()
          -- the same customer coming back from Paystack to try again takes over their own hold
          or piece_stock.held_by in (select reference from payments where email = ${email} and status = 'pending'))
      returning slug`;
    if (held.length < oneOfOnes.length) {
      await db()`update piece_stock set held_until = null, held_by = null where held_by = ${reference}`;
      const got = new Set(held.map((r) => r.slug as string));
      const rows = await db()`select slug, sold_at is not null as sold from piece_stock where slug = any(${oneOfOnes.filter((s) => !got.has(s))}::text[])`;
      return { ok: false, error: "Someone else got there first.", unavailable: rows.map((r) => ({ slug: r.slug as string, sold: Boolean(r.sold) })) };
    }
  }

  const items = pieces.map((p) => ({ slug: p!.slug, name: p!.name, image: p!.images[0], price: p!.price!, size: p!.size ?? p!.leadTime, kind: p!.kind }));
  const total = items.reduce((t, p) => t + p.price, 0);
  const cart = {
    details: { items, piece: { name: items.map((p) => p.name).join(" and "), image: items[0].image, source: "product" }, notes: note || undefined },
    name,
    phone: fullPhone(digits),
    last4: digits.slice(-4),
    state,
    area: town ? `${town}, ${area}` : area,
    address,
  };
  await db()`insert into payments (reference, purpose, order_code, amount, email, cart) values (${reference}, 'shop', ${code}, ${total}, ${email}, ${JSON.stringify(cart)}::jsonb)`;
  try {
    const url = await startPaystack({ email, naira: total, reference, callbackUrl: `${siteUrl}/t/${code}`, cancelUrl: `${siteUrl}/checkout`, metadata: { purpose: "shop" } });
    return { ok: true, url };
  } catch (e) {
    console.error("startShopCheckout", e);
    await db().transaction((sql) => [
      sql`update payments set status = 'failed' where reference = ${reference}`,
      sql`update piece_stock set held_until = null, held_by = null where held_by = ${reference}`,
    ]);
    return { ok: false, error: "Paystack didn’t answer. Try again in a moment." };
  }
}

/** Which of these one-of-one pieces have sold, or are being paid for right now. */
export async function pieceStatus(slugs: string[]) {
  const clean = slugs.filter((s) => /^[a-z0-9-]{2,80}$/.test(s)).slice(0, 60);
  if (!clean.length) return { sold: [] as string[], held: [] as string[] };
  const rows = await db()`select slug, sold_at is not null as sold, coalesce(held_until > now(), false) as held from piece_stock where slug = any(${clean}::text[])`;
  return { sold: rows.filter((r) => r.sold).map((r) => r.slug as string), held: rows.filter((r) => !r.sold && r.held).map((r) => r.slug as string) };
}

/* ------------------------------- paid, for real ------------------------------- */

export type Settled = "paid" | "pending" | "failed" | "unknown";

/**
 * Asks Paystack about a payment and, if it went through, applies it: the order moves on, Mimi's phone
 * pings, a shop order is made and its pieces are marked sold. Safe to call any number of times, from the
 * return trip and from the webhook.
 */
export async function settlePayment(reference: string): Promise<Settled> {
  if (!isReference(reference)) return "unknown";
  const [p] = await db()`select id, purpose, status, amount from payments where reference = ${reference}`;
  if (!p) return "unknown";
  if (p.status === "success") return "paid";
  if (p.status === "failed") return "failed";

  const v = await verifyPaystack(reference);
  if (v.failed) {
    await db().transaction((sql) => [
      sql`update payments set status = 'failed' where id = ${p.id} and status = 'pending'`,
      sql`update piece_stock set held_until = null, held_by = null where held_by = ${reference} and sold_at is null`,
    ]);
    return "failed";
  }
  if (!v.paid) return "pending";
  if (v.currency !== "NGN" || v.kobo !== (p.amount as number) * 100) {
    console.error("Paystack paid a different amount", reference, v.kobo, p.amount);
    return "pending";
  }

  if (p.purpose === "shop") await paidShop(p.id as string, reference, v.channel);
  else await paidOrder(p.id as string, p.purpose as OrderPurpose, v.channel);
  return "paid";
}

async function paidOrder(paymentId: string, purpose: OrderPurpose, channel: string | null) {
  const balance = purpose === "balance";
  const note = balance ? "Balance paid on Paystack. Mimi is booking your rider." : purpose === "full" ? "Paid in full on Paystack. Mimi is starting." : "Deposit paid on Paystack. Mimi is starting.";
  const [r] = balance
    ? await db()`
        with p as (update payments set status = 'success', paid_at = now(), channel = ${channel} where id = ${paymentId} and status = 'pending' returning order_id),
        o as (update orders set balance_paid = true, updated_at = now()
              where id in (select order_id from p) and stage = 3 and deposit_paid and not paid_in_full and not balance_paid
              returning id, number, name, price),
        u as (insert into order_updates (order_id, stage, note) select id, 3, ${note} from o)
        select p.order_id, o.number, o.name, o.price, (select number from orders where id = p.order_id) as any_number from p left join o on o.id = p.order_id`
    : await db()`
        with p as (update payments set status = 'success', paid_at = now(), channel = ${channel} where id = ${paymentId} and status = 'pending' returning order_id),
        o as (update orders set stage = 2, deposit_paid = true, paid_in_full = ${purpose === "full"}, payment_sent = null, updated_at = now()
              where id in (select order_id from p) and stage = 1 and not deposit_paid
              returning id, number, name, price),
        u as (insert into order_updates (order_id, stage, note) select id, 2, ${note} from o)
        select p.order_id, o.number, o.name, o.price, (select number from orders where id = p.order_id) as any_number from p left join o on o.id = p.order_id`;
  if (!r) return; // already counted by the other path
  if (!r.number) {
    // Paid on Paystack after the order had already moved on (say Mimi marked it paid by hand): tell her.
    await notifyMimi({ title: "Check a Paystack payment", body: `${r.any_number} was paid again on Paystack after it was already marked paid.`, url: "/studio", tag: r.any_number });
    return;
  }
  const price = r.price as number;
  const amount = formatNaira(balance ? price - depositOf(price) : purpose === "full" ? price : depositOf(price));
  await notifyMimi(
    balance
      ? { title: `${r.name} paid the balance`, body: `${amount} for ${r.number}. Book their rider.`, url: "/studio", tag: r.number }
      : { title: purpose === "full" ? `${r.name} paid in full` : `${r.name} paid the deposit`, body: `${amount} for ${r.number}. Time to start.`, url: "/studio", tag: r.number },
  );
}

async function paidShop(paymentId: string, reference: string, channel: string | null) {
  const [r] = await db()`
    with p as (update payments set status = 'success', paid_at = now(), channel = ${channel} where id = ${paymentId} and status = 'pending' returning cart, order_code, amount, email),
    o as (insert into orders (code, kind, stage, sent, details, name, phone, phone_last4, email, state, area, address, price)
          select order_code, 'shop', 0, true, cart->'details', cart->>'name', cart->>'phone', cart->>'last4', email, cart->>'state', cart->>'area', cart->>'address', amount from p
          returning id, number, name, price),
    u as (insert into order_updates (order_id, stage, note) select id, 0, 'Paid on Paystack. Mimi is packing it.' from o),
    s as (insert into piece_stock (slug, sold_at, order_id)
          select i->>'slug', now(), (select id from o) from p, jsonb_array_elements(p.cart->'details'->'items') i where i->>'kind' = 'ready'
          on conflict (slug) do update set sold_at = now(), order_id = excluded.order_id, held_until = null, held_by = null)
    select o.id, o.number, o.name, o.price, (select cart->'details'->'items' from p) as items from o`;
  if (!r) return;
  await db()`update payments set order_id = ${r.id} where reference = ${reference}`;
  const names = (r.items as { name: string }[]).map((i) => i.name).join(" and ");
  await notifyMimi({ title: `New order from ${r.name}`, body: `${formatNaira(r.price as number)} paid · ${names}`, url: "/studio", tag: r.number });
}
