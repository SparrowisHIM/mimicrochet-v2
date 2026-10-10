import { orderTakingFiles, saveOrderFile } from "@/lib/server/orders";
import { checkPhoto, checkVoice, MAX_UPLOAD_BYTES } from "@/lib/server/uploads";

// Adds one of the customer's photos (?kind=photo&position=0…5) or their voice note (?kind=voice&position=0)
// to the order they just placed. The body is the file itself. Every file is checked again here.

const answer = (status: number, reason?: string) => Response.json(reason ? { ok: false, reason } : { ok: true }, { status });

export async function POST(request: Request, ctx: RouteContext<"/api/orders/[code]/files">) {
  // Only this site's own pages may post here (a server action gets this check from Next.js).
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return answer(403, "wrong site");

  const { code } = await ctx.params;
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const position = Number(url.searchParams.get("position"));
  if ((kind !== "photo" && kind !== "voice") || !Number.isInteger(position)) return answer(400, "bad request");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES) return answer(413, "too big");

  try {
    const order = await orderTakingFiles(code);
    if (!order) return answer(404, "no order taking files");
    const allowed = kind === "photo" ? position >= 0 && position < order.photoCount : order.hasVoice && position === 0;
    if (!allowed) return answer(400, "not part of this order");

    const body = Buffer.from(await request.arrayBuffer());
    if (body.length > MAX_UPLOAD_BYTES) return answer(413, "too big");

    if (kind === "photo") {
      const p = await checkPhoto(body);
      if (!p.ok) return answer(422, p.reason);
      await saveOrderFile({ orderId: order.id, kind, position, data: p.data, contentType: "image/jpeg", width: p.width, height: p.height });
    } else {
      const v = checkVoice(body);
      if (!v.ok) return answer(422, v.reason);
      await saveOrderFile({ orderId: order.id, kind, position, data: v.data, contentType: v.contentType });
    }
    return answer(200);
  } catch (e) {
    console.error("order file upload", e);
    return answer(500, "couldn't save");
  }
}
