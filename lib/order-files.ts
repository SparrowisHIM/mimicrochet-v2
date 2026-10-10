// Sends the customer's photos and voice note to their order on the server, in the background while the
// sending moment plays. One at a time (phones on slow data do better than with several at once), each
// tried twice. If one still fails, the order is fine: Mimi gets every file on WhatsApp too.

async function upload(code: string, kind: "photo" | "voice", position: number, file: File) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`/api/orders/${code}/files?kind=${kind}&position=${position}`, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      // A refusal (not a photo, too big, can't be read) won't change on a retry.
      if (res.ok || (res.status >= 400 && res.status < 500)) return res.ok;
    } catch {
      // offline for a moment: try once more
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

export async function uploadOrderFiles(code: string, photos: File[], voice?: File) {
  const results: boolean[] = [];
  for (const [i, file] of photos.entries()) results.push(await upload(code, "photo", i, file));
  if (voice) results.push(await upload(code, "voice", 0, voice));
  return results.every(Boolean);
}
