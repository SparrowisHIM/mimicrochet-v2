import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { db } from "@/lib/server/db";
import { deleteFile, putFile } from "@/lib/server/files";
import type { CleanCustomOrder } from "@/lib/server/order-input";
import { isOrderCode, makeCode } from "@/lib/order-code";
import type { Order } from "@/lib/orders";
import { fullPhone } from "@/lib/validate";

// Orders on the server. A tracking code is the key to one order's page, so it's random, long enough
// that guessing is hopeless, and checked for shape before any query. What leaves here for a tracking
// page is only what that page shows: never the phone number or a street address.

const newCode = () => makeCode(randomInt);

/** "Today", "Yesterday" or "2 Oct", in Nigerian time, as the tracking page and Mimi's page show it. */
function dayLabel(at: Date) {
  const day = (d: Date) => d.toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" });
  const now = new Date();
  if (day(at) === day(now)) return "Today";
  if (day(at) === day(new Date(now.getTime() - 86_400_000))) return "Yesterday";
  return at.toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short" });
}

export async function createCustomOrder(o: CleanCustomOrder) {
  const sql = db();
  const { name, phone, state, area, ...details } = o;
  const note = "Request prepared. Send the details to Mimi on WhatsApp to confirm.";
  // A clash between two random codes is all but impossible; try again if it ever happens.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const [row] = await sql`
        with o as (
          insert into orders (code, kind, details, name, phone, phone_last4, state, area)
          values (${newCode()}, 'custom', ${JSON.stringify(details)}::jsonb, ${name}, ${fullPhone(phone)}, ${phone.slice(-4)}, ${state}, ${area})
          returning id, number, code, created_at
        ), u as (
          insert into order_updates (order_id, stage, note) select id, 0, ${note} from o
        )
        select number, code, created_at from o`;
      return { id: row.number as string, code: row.code as string, createdAt: new Date(row.created_at).toISOString() };
    } catch (e) {
      if ((e as { code?: string }).code === "23505" && attempt < 2) continue;
      throw e;
    }
  }
  throw new Error("Could not make a tracking code");
}

/** The order behind a tracking link, shaped like the page's own Order, or null. */
export async function orderForTracking(code: string): Promise<Order | null> {
  if (!isOrderCode(code)) return null;
  // One round trip: the order with its updates, oldest first.
  const [o] = await db()`
    select number, code, kind, stage, sent, details, name, state, area, price, ready_by, deposit_paid, paid_in_full, payment_sent, created_at,
      coalesce((select json_agg(json_build_object('stage', u.stage, 'note', u.note, 'photo', u.photo, 'at', u.created_at) order by u.created_at, u.id)
                from order_updates u where u.order_id = orders.id), '[]') as updates,
      coalesce((select json_agg(f.position order by f.position) from order_files f where f.order_id = orders.id and f.kind = 'photo'), '[]') as photos
    from orders where code = ${code}`;
  if (!o) return null;
  const updates = o.updates as { stage: number; note: string; photo: string | null; at: string }[];
  // The customer's photos, served only through their own order's link (see orderFile below).
  const photos = (o.photos as number[]).map((n) => `/api/orders/${code}/files/photo/${n}`);
  const d = o.details as Omit<CleanCustomOrder, "name" | "phone" | "state" | "area">;
  return {
    onServer: true,
    kind: o.kind,
    id: o.number,
    code: o.code,
    createdAt: new Date(o.created_at).toISOString(),
    // An order from the customer's own photo shows that photo as the piece.
    piece: d.piece.source === "photo" && !d.piece.image && photos[0] ? { ...d.piece, image: photos[0] } : d.piece,
    pieceKind: d.pieceKind,
    photos,
    hasVoiceNote: d.hasVoiceNote,
    description: d.description,
    size: d.size,
    measurements: d.measurements,
    height: d.height,
    fit: d.fit,
    colours: d.colours,
    colourNote: d.colourNote,
    when: d.when,
    budget: d.budget,
    notes: d.notes,
    name: o.name,
    phone: "",
    state: o.state,
    area: o.area,
    stage: o.stage,
    sent: o.sent,
    price: o.price ?? undefined,
    readyBy: o.ready_by ?? undefined,
    depositPaid: o.deposit_paid,
    paidInFull: o.paid_in_full,
    paymentSent: o.payment_sent ?? undefined,
    updates: updates.map((u) => ({ stage: u.stage, note: u.note, at: dayLabel(new Date(u.at)), ...(u.photo ? { photo: u.photo } : {}) })),
  };
}

/**
 * Track an order from any phone: the order number alone never opens an order (numbers count up, so
 * they're easy to guess); it must come with the last 4 digits of the phone number on the order.
 */
export async function codeForOrder(number: string, last4: string) {
  const digits = number.replace(/\D/g, "");
  if (!/^\d{3,7}$/.test(digits) || !/^\d{4}$/.test(last4)) return null;
  const [row] = await db()`select code from orders where number = ${`MIMI-${digits}`} and phone_last4 = ${last4}`;
  return (row?.code as string | undefined) ?? null;
}

/** The customer tapped Send on WhatsApp: Mimi has the request now. */
export async function markSent(code: string) {
  if (!isOrderCode(code)) return false;
  const rows = await db()`
    with o as (
      update orders set sent = true, updated_at = now() where code = ${code} and kind = 'custom' and not sent returning id
    )
    update order_updates set note = 'Request sent to Mimi on WhatsApp.' where stage = 0 and order_id in (select id from o)
    returning order_id`;
  return rows.length > 0;
}

/** The customer says they've paid the deposit or the full price. Mimi still confirms it. */
export async function reportPayment(code: string, which: "deposit" | "full") {
  if (!isOrderCode(code)) return false;
  const rows = await db()`
    update orders set payment_sent = ${which}, updated_at = now()
    where code = ${code} and stage = 1 and price is not null and not deposit_paid
    returning id`;
  return rows.length > 0;
}

/* -------------------------------- files --------------------------------- */

/**
 * The order a customer's photos and voice note may be added to: their own order (the code is the key),
 * only within 3 hours of placing it and before Mimi has set a price, and only as many files as the
 * order said it had.
 */
export async function orderTakingFiles(code: string) {
  if (!isOrderCode(code)) return null;
  const [o] = await db()`
    select id, (details->>'photoCount')::int as photo_count, (details->>'hasVoiceNote')::boolean as has_voice
    from orders where code = ${code} and kind = 'custom' and stage = 0 and created_at > now() - interval '3 hours'`;
  return o ? { id: o.id as string, photoCount: (o.photo_count as number) ?? 0, hasVoice: Boolean(o.has_voice) } : null;
}

/** Stores a checked file and records it. A retry of the same photo or voice note is a no-op. */
export async function saveOrderFile(f: { orderId: string; kind: "photo" | "voice"; position: number; data: Buffer; contentType: string; width?: number; height?: number }) {
  // Random names: a file's key says nothing about the customer and can't be guessed.
  const key = `orders/${f.orderId}/${f.kind}-${f.position}-${randomBytes(12).toString("hex")}`;
  await putFile(key, f.data, f.contentType);
  const rows = await db()`
    insert into order_files (order_id, kind, position, key, content_type, bytes, width, height)
    values (${f.orderId}, ${f.kind}, ${f.position}, ${key}, ${f.contentType}, ${f.data.length}, ${f.width ?? null}, ${f.height ?? null})
    on conflict (order_id, kind, position) do nothing
    returning id`;
  if (!rows.length) await deleteFile(key);
  return true;
}

/** A customer's file, looked up through their order's code, or null. */
export async function orderFile(code: string, kind: string, position: number) {
  if (!isOrderCode(code) || (kind !== "photo" && kind !== "voice") || !Number.isInteger(position) || position < 0 || position > 19) return null;
  const [f] = await db()`
    select f.key, f.content_type from order_files f join orders o on o.id = f.order_id
    where o.code = ${code} and f.kind = ${kind} and f.position = ${position}`;
  return f ? { key: f.key as string, contentType: f.content_type as string } : null;
}
