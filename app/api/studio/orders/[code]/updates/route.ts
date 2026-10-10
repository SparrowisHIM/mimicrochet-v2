import { putFile, deleteFile } from "@/lib/server/files";
import { db } from "@/lib/server/db";
import { isStudio } from "@/lib/server/session";
import { addUpdate, nextProgressSlot } from "@/lib/server/studio";
import { checkPhoto, MAX_UPLOAD_BYTES } from "@/lib/server/uploads";
import { randomBytes } from "node:crypto";

// Mimi posts an update to an order's page: a note, an optional progress photo (checked and redrawn like
// every upload), and whether it's ready. Sent as a form; only from her signed-in studio.

const answer = (status: number, reason?: string) => Response.json(reason ? { ok: false, reason } : { ok: true }, { status });

export async function POST(request: Request, ctx: RouteContext<"/api/studio/orders/[code]/updates">) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return answer(403, "wrong site");
  if (!(await isStudio())) return answer(401, "not signed in");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 20_000) return answer(413, "too big");

  const { code } = await ctx.params;
  let key: string | null = null;
  try {
    const form = await request.formData();
    const note = typeof form.get("note") === "string" ? (form.get("note") as string) : "";
    const ready = form.get("ready") === "1";
    const photo = form.get("photo");

    let url: string | undefined;
    if (photo instanceof File && photo.size > 0) {
      const slot = await nextProgressSlot(code);
      if (!slot) return answer(404, "no such order");
      if (slot.stage < 2 || slot.stage > 3) return answer(409, "this order can't take updates now");
      if (slot.position > 19) return answer(409, "up to 20 photos per order");
      const checked = await checkPhoto(Buffer.from(await photo.arrayBuffer()));
      if (!checked.ok) return answer(422, checked.reason);
      key = `orders/${slot.orderId}/progress-${slot.position}-${randomBytes(12).toString("hex")}`;
      await putFile(key, checked.data, "image/jpeg");
      await db()`
        insert into order_files (order_id, kind, position, key, content_type, bytes, width, height)
        values (${slot.orderId}, 'progress', ${slot.position}, ${key}, 'image/jpeg', ${checked.data.length}, ${checked.width}, ${checked.height})`;
      url = `/api/orders/${code}/files/progress/${slot.position}`;
    } else if (!note.trim() && !ready) return answer(400, "nothing to post");

    if (!(await addUpdate(code, note, ready, url))) return answer(409, "this order can't take updates now");
    key = null;
    return answer(200);
  } catch (e) {
    console.error("studio update", e);
    if (key) await deleteFile(key).catch(() => {});
    return answer(500, "couldn't post");
  }
}
