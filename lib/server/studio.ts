import "server-only";
import { db } from "@/lib/server/db";
import { deleteFile } from "@/lib/server/files";
import { depositOf, isOrderCode } from "@/lib/order-code";
import type { Order } from "@/lib/orders";
import { formatNaira } from "@/lib/site";

// Mimi's side of the orders: everything she needs to see (including the customer's phone number, which
// the tracking page never shows) and the changes only she can make. Every function here is called
// from app/actions/studio.ts after the sign-in check.

export type StudioOrder = Order & { due: string; dueTone: "normal" | "soon" | "late"; ago: string };

const lagosDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }); // YYYY-MM-DD
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
/** "Fri 16 Oct", the way the date picker and the tracking page write it. */
export const readyLabel = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** "Just now", "3h ago", "Yesterday" or "3 Oct", in Nigerian time. */
function ago(at: Date) {
  const mins = (Date.now() - at.getTime()) / 60_000;
  if (mins < 60) return mins < 2 ? "Just now" : `${Math.floor(mins)} min ago`;
  const days = daysBetween(lagosDay(at), lagosDay(new Date()));
  if (days === 0) return `${Math.floor(mins / 60)}h ago`;
  if (days === 1) return "Yesterday";
  return at.toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short" });
}

/** Open orders (not yet delivered) that the customer has sent, newest first. */
export async function ordersForStudio(): Promise<StudioOrder[]> {
  const rows = await db()`
    select number, code, kind, stage, sent, details, name, phone, state, area, address, price, ready_by, ready_on::text as ready_on, deposit_paid, paid_in_full, payment_sent, created_at,
      coalesce((select json_agg(json_build_object('stage', u.stage, 'note', u.note, 'photo', u.photo, 'at', u.created_at) order by u.created_at, u.id)
                from order_updates u where u.order_id = orders.id), '[]') as updates,
      coalesce((select json_agg(json_build_object('kind', f.kind, 'position', f.position) order by f.position)
                from order_files f where f.order_id = orders.id and f.kind in ('photo', 'voice')), '[]') as files
    from orders
    where stage < 4 and (kind = 'shop' or sent)
    order by created_at desc
    limit 200`;
  const today = lagosDay(new Date());
  return rows.map((o) => {
    const d = o.details as Partial<Order> & { photoCount?: number };
    const files = o.files as { kind: string; position: number }[];
    const url = (kind: string, n: number) => `/api/orders/${o.code}/files/${kind}/${n}`;
    const photos = files.filter((f) => f.kind === "photo").map((f) => url("photo", f.position));
    const voice = files.find((f) => f.kind === "voice");
    const readyOn = (o.ready_on as string | null) ?? null; // YYYY-MM-DD, as stored
    const left = readyOn ? daysBetween(today, readyOn) : null;
    const dueTone = left !== null && o.stage < 3 ? (left < 0 ? "late" : left <= 3 ? "soon" : "normal") : "normal";
    const created = new Date(o.created_at);
    const piece = d.piece!;
    return {
      ...(d as object),
      kind: o.kind,
      id: o.number,
      code: o.code,
      createdAt: created.toISOString(),
      piece: piece.source === "photo" && !piece.image && photos[0] ? { ...piece, image: photos[0] } : piece,
      photos,
      voiceNote: voice ? url("voice", voice.position) : undefined,
      name: o.name,
      phone: o.phone,
      state: o.state,
      area: o.address ? `${o.address}, ${o.area}` : o.area,
      stage: o.stage,
      sent: o.sent,
      price: o.price ?? undefined,
      readyBy: o.ready_by ?? undefined,
      depositPaid: o.deposit_paid,
      paidInFull: o.paid_in_full,
      paymentSent: o.payment_sent ?? undefined,
      updates: (o.updates as { stage: number; note: string; photo: string | null; at: string }[]).map((u) => ({ stage: u.stage, note: u.note, at: ago(new Date(u.at)), ...(u.photo ? { photo: u.photo } : {}) })),
      due: o.stage === 0 || !o.ready_by ? ago(created) : o.ready_by,
      dueTone,
      // For "Requested 2h ago" / "yesterday" / "3 Oct": relative words in lower case, dates as they are.
      ago: /^\d/.test(ago(created)) ? ago(created) : ago(created).toLowerCase(),
    } as StudioOrder;
  });
}

/* ------------------------------- Mimi's changes ------------------------------- */

const one = async (code: string) => {
  if (!isOrderCode(code)) return null;
  const [o] = await db()`select id, stage, price, deposit_paid from orders where code = ${code}`;
  return (o as { id: string; stage: number; price: number | null; deposit_paid: boolean } | undefined) ?? null;
};

/** Agree the price and the ready-by date. Allowed until a payment has come in. */
export async function setPrice(code: string, total: number, readyOn: string) {
  const o = await one(code);
  if (!o || o.stage > 1 || o.deposit_paid) return false;
  if (!Number.isInteger(total) || total < 1000 || total > 10_000_000) return false;
  const today = lagosDay(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(readyOn) || daysBetween(today, readyOn) < 1 || daysBetween(today, readyOn) > 366) return false;
  const label = readyLabel(readyOn);
  const note = `${formatNaira(total)}, ready by ${label}. Deposit ${formatNaira(depositOf(total))}, or pay it all now.`;
  await db().transaction((sql) => [
    sql`update orders set stage = 1, price = ${total}, ready_by = ${label}, ready_on = ${readyOn}, deposit_paid = false, paid_in_full = false, payment_sent = null, updated_at = now() where id = ${o.id}`,
    sql`insert into order_updates (order_id, stage, note) values (${o.id}, 1, ${note})`,
  ]);
  return true;
}

/** The deposit (or the full price) is in Mimi's bank: the order moves to "In progress". */
export async function confirmPayment(code: string, full: boolean) {
  const o = await one(code);
  if (!o || o.stage !== 1 || !o.price || o.deposit_paid) return false;
  await db().transaction((sql) => [
    sql`update orders set stage = 2, deposit_paid = true, paid_in_full = ${full}, updated_at = now() where id = ${o.id}`,
    sql`insert into order_updates (order_id, stage, note) values (${o.id}, 2, ${full ? "Paid in full. Mimi is starting." : "Deposit received. Mimi is starting."})`,
  ]);
  return true;
}

/** A progress note (and photo) while it's being made; `ready` also moves it to "Ready". */
export async function addUpdate(code: string, note: string, ready: boolean, photo?: string) {
  const o = await one(code);
  if (!o || o.stage < 2 || o.stage > 3) return false;
  const stage = ready ? 3 : o.stage;
  const text = note.trim().slice(0, 300) || (ready ? "All done! Photos on WhatsApp." : "New photo from Mimi.");
  await db().transaction((sql) => [
    sql`update orders set stage = ${stage}, updated_at = now() where id = ${o.id}`,
    sql`insert into order_updates (order_id, stage, note, photo) values (${o.id}, ${stage}, ${text}, ${photo ?? null})`,
  ]);
  return true;
}

export async function markReady(code: string) {
  return addUpdate(code, "All done! Photos on WhatsApp.", true);
}

/** Delivered: the order leaves Mimi's list, and the 2-month clock on the customer's files starts. */
export async function markDelivered(code: string) {
  const o = await one(code);
  if (!o || o.stage !== 3) return false;
  await db().transaction((sql) => [
    sql`update orders set stage = 4, delivered_at = now(), updated_at = now() where id = ${o.id}`,
    sql`insert into order_updates (order_id, stage, note) values (${o.id}, 4, 'Delivered. Enjoy wearing it!')`,
  ]);
  return true;
}

/** The next free slot for one of Mimi's progress photos on this order. */
export async function nextProgressSlot(code: string) {
  const o = await one(code);
  if (!o) return null;
  const [r] = await db()`select coalesce(max(position) + 1, 0)::int as n from order_files where order_id = ${o.id} and kind = 'progress'`;
  return { orderId: o.id, stage: o.stage, position: r.n as number };
}

/**
 * Customers' photos and voice notes are deleted 2 months after their order was delivered (what the
 * privacy page promises). Mimi's own progress photos stay with the order. Safe to run often.
 */
export async function deleteExpiredCustomerFiles() {
  const files = await db()`
    select f.id, f.key from order_files f join orders o on o.id = f.order_id
    where f.kind in ('photo', 'voice') and o.delivered_at < now() - interval '2 months'
    limit 200`;
  for (const f of files) {
    await deleteFile(f.key as string).catch((e) => console.error("delete file", e));
    await db()`delete from order_files where id = ${f.id}`;
  }
  if (files.length)
    await db()`update orders set files_deleted_at = now() where delivered_at < now() - interval '2 months' and files_deleted_at is null`;
  return files.length;
}
