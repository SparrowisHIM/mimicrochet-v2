import { getFile } from "@/lib/server/files";
import { orderFile } from "@/lib/server/orders";

// One of an order's files, for the people who hold its tracking link. Files are never listed or
// served by their storage name: only through the order they belong to. Byte ranges are answered,
// because iPhones only play audio from a server that can send part of a file.

const fail = (status: number, text: string) => new Response(text, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request, ctx: RouteContext<"/api/orders/[code]/files/[kind]/[n]">) {
  const { code, kind, n } = await ctx.params;
  try {
    const f = await orderFile(code, kind, Number(n));
    const data = f && (await getFile(f.key));
    if (!f || !data) return fail(404, "Not found");

    const size = data.byteLength;
    const headers: Record<string, string> = {
      "Content-Type": f.contentType,
      "Accept-Ranges": "bytes",
      // Private to this person's browser; the file under a position never changes once saved.
      "Cache-Control": "private, max-age=604800, immutable",
      "Content-Disposition": "inline",
      "Cross-Origin-Resource-Policy": "same-origin",
    };

    const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
    if (range && (range[1] || range[2])) {
      // "bytes=100-" (from 100 on), "bytes=-500" (the last 500), "bytes=0-1" (Safari's first probe)
      const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      return new Response(data.slice(start, end + 1), {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
      });
    }
    return new Response(data, { headers: { ...headers, "Content-Length": String(size) } });
  } catch (e) {
    console.error("order file", e);
    return fail(500, "Couldn't load the file");
  }
}
