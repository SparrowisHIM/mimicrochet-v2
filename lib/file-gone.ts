// Order photos and voice notes come from the server, and a slow first request can fail even though the
// file is there. Before a page says "no longer available", it asks: only a 404 means the file is gone.

/** True only when the server says this order file doesn't exist (deleted, or never uploaded). */
export async function fileIsGone(url: string) {
  if (!url.startsWith("/api/")) return true; // a phone's own preview (blob:) can't be asked about
  try {
    const r = await fetch(url, { headers: { Range: "bytes=0-0" }, cache: "no-store" });
    return r.status === 404;
  } catch {
    return false; // no answer at all: the connection, not the file
  }
}

/** The same address with a retry number, so the browser asks again instead of reusing the failed load. */
export const retryUrl = (url: string, attempt: number) => (attempt ? `${url}${url.includes("?") ? "&" : "?"}retry=${attempt}` : url);

/** After a failed load: give up only when the server says the file is gone, otherwise try again (at most twice). */
export async function afterFailedLoad(url: string, tries: { current: number }, gone: () => void, retry: (attempt: number) => void) {
  if (await fileIsGone(url)) return gone();
  if (tries.current >= 2) return;
  const attempt = ++tries.current;
  setTimeout(() => retry(attempt), 800);
}
