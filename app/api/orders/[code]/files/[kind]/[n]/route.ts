import { getFile } from "@/lib/server/files";
import { orderFile } from "@/lib/server/orders";

// One of an order's files, for the people who hold its tracking link. Files are never listed or
// served by their storage name: only through the order they belong to.

export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[code]/files/[kind]/[n]">) {
  const { code, kind, n } = await ctx.params;
  try {
    const f = await orderFile(code, kind, Number(n));
    const data = f && (await getFile(f.key));
    if (!f || !data) return new Response("Not found", { status: 404 });
    return new Response(data, {
      headers: {
        "Content-Type": f.contentType,
        "Content-Length": String(data.byteLength),
        // Private to this person's browser; the file under a position never changes once saved.
        "Cache-Control": "private, max-age=604800, immutable",
        "Content-Disposition": "inline",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (e) {
    console.error("order file", e);
    return new Response("Couldn't load the file", { status: 500 });
  }
}
