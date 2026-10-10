// Sends the customer's photos and voice note to their order on the server, in the background while the
// sending moment plays and after. One at a time (phones on slow data do better than with several at
// once). If the connection drops, or the customer switches to WhatsApp and the phone pauses the page,
// a file waits until the page is back and online, then tries again. If one still can't get through,
// the order is fine: Mimi gets every file on WhatsApp too.

/** Netlify's server functions take request bodies up to about 4.5 MB (lib/server/uploads.ts uses the same). */
export const MAX_UPLOAD_BYTES = 4_400_000;
const ATTEMPTS = 5;
/** The server takes files for 3 hours after the order is placed; there's no point trying after that. */
const GIVE_UP_AFTER = 3 * 60 * 60 * 1000;

/** Files the server would refuse are never sent, so nobody spends their data on them. */
export function worthUploading(file: File) {
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) return false;
  // iPhone HEIC photos this browser couldn't convert: the server can't read them either.
  return !/hei[cf]/i.test(file.type) && !/\.hei[cf]$/i.test(file.name);
}

/** Resolves once the page is in front and the phone is online again. */
function backInReach() {
  const ready = () => document.visibilityState === "visible" && navigator.onLine;
  if (ready()) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const check = () => {
      if (!ready()) return;
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", check);
      resolve();
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", check);
  });
}

async function upload(code: string, kind: "photo" | "voice", position: number, file: File, started: number) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    await backInReach();
    if (Date.now() - started > GIVE_UP_AFTER) return false;
    try {
      const res = await fetch(`/api/orders/${code}/files?kind=${kind}&position=${position}`, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      // A refusal (not a photo, not part of this order) won't change on a retry.
      if (res.ok || (res.status >= 400 && res.status < 500)) return res.ok;
    } catch {
      // the connection dropped: wait and try again
    }
    await new Promise((r) => setTimeout(r, Math.min(1500 * 2 ** (attempt - 1), 20_000)));
  }
  return false;
}

/** Positions follow the order the customer picked their photos in, so the first stays the main one. */
export async function uploadOrderFiles(code: string, photos: File[], voice?: File) {
  const started = Date.now();
  let all = true;
  for (const [i, file] of photos.entries()) {
    if (!worthUploading(file)) continue;
    all = (await upload(code, "photo", i, file, started)) && all;
  }
  if (voice && worthUploading(voice)) all = (await upload(code, "voice", 0, voice, started)) && all;
  return all;
}
