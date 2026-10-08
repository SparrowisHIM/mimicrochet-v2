"use client";

// Every photo someone attaches goes through checkPhoto before it joins an order:
// - It's judged by what the file actually is (its first bytes), never by its name or the type the
//   browser reports, so a program or web page renamed photo.jpg is turned away. SVG is never
//   accepted: it's a document that can carry scripts, not a photo.
// - Size is capped (25 MB a file), and so is the picture's pixel count, so a tiny file that claims
//   to be 50,000 pixels wide (a "decompression bomb") can't freeze the page.
// - What's kept is a fresh JPEG redrawn from the pixels: anything hidden in the original file
//   (scripts, a second file tucked inside, the phone's GPS location in its EXIF data) is left behind.
// - iPhone HEIC photos are converted. A real HEIC or TIFF photo this browser can't draw at all is kept
//   as it is, so Mimi still gets it; the server must check and convert those (see notes.md).
// The server has to repeat these checks when uploads go live: a browser check can be skipped by
// anyone who sends files to the server directly.

export type PhotoKind = "jpeg" | "png" | "gif" | "webp" | "bmp" | "tiff" | "heic" | "avif";

export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
export const MAX_PHOTO_PIXELS = 100_000_000;
/** The long side of the copy that's kept: plenty for Mimi to see the detail, small enough to send. */
const KEEP_SIZE = 2560;

const HEIF_BRANDS = ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"];

/** What the file really is, from its first bytes. Null for anything that isn't a photo. */
export async function sniffPhoto(file: Blob): Promise<PhotoKind | null> {
  const b = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const bytes = (at: number, ...want: number[]) => want.every((x, i) => b[at + i] === x);
  const ascii = (at: number, s: string) => [...s].every((c, i) => b[at + i] === c.charCodeAt(0));
  if (bytes(0, 0xff, 0xd8, 0xff)) return "jpeg";
  if (bytes(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (ascii(0, "GIF87a") || ascii(0, "GIF89a")) return "gif";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "webp";
  if (ascii(0, "BM")) return "bmp";
  if (bytes(0, 0x49, 0x49, 0x2a, 0x00) || bytes(0, 0x4d, 0x4d, 0x00, 0x2a)) return "tiff";
  if (ascii(4, "ftyp")) {
    const brand = String.fromCharCode(...b.slice(8, 12));
    if (brand === "avif" || brand === "avis") return "avif";
    if (HEIF_BRANDS.includes(brand)) return "heic";
  }
  return null;
}

/** The picture's width and height, read from the file's header without decoding it, so an oversized
 *  picture is refused before the browser spends memory on it. Null when the header doesn't say. */
async function headerSize(file: Blob, kind: PhotoKind): Promise<[number, number] | null> {
  const b = new Uint8Array(await file.slice(0, kind === "jpeg" ? 512 * 1024 : 64).arrayBuffer());
  const be16 = (i: number) => (b[i] << 8) | b[i + 1];
  const le16 = (i: number) => b[i] | (b[i + 1] << 8);
  const be32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const le32 = (i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
  const tag = (i: number) => String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);
  switch (kind) {
    case "png":
      return [be32(16), be32(20)];
    case "gif":
      return [le16(6), le16(8)];
    case "bmp":
      return [le32(18) | 0, Math.abs(le32(22) | 0)];
    case "webp":
      if (tag(12) === "VP8 ") return [le16(26) & 0x3fff, le16(28) & 0x3fff];
      if (tag(12) === "VP8L") return [1 + (((b[22] & 0x3f) << 8) | b[21]), 1 + (((b[24] & 0xf) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6))];
      if (tag(12) === "VP8X") return [1 + (b[24] | (b[25] << 8) | (b[26] << 16)), 1 + (b[27] | (b[28] << 8) | (b[29] << 16))];
      return null;
    case "jpeg": {
      // Walk the markers to the frame header (SOF), which holds the size.
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) return null;
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [be16(i + 7), be16(i + 5)];
        i += 2 + be16(i + 2);
      }
      return null;
    }
    default:
      return null;
  }
}

/** A file name that's safe to show: no control characters or right-to-left marks that disguise
 *  the real extension (a file shown as "photoexe.jpg" that is really a .exe), and not too long. */
export function safeName(name: string) {
  const clean = name.replace(/[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "").replace(/\s+/g, " ").trim() || "photo";
  if (clean.length <= 48) return clean;
  const dot = clean.lastIndexOf(".");
  const ext = dot > 0 && clean.length - dot <= 6 ? clean.slice(dot) : "";
  return `${clean.slice(0, 44 - ext.length)}…${ext}`;
}

/** iPhone photos (HEIC/HEIF) can't be drawn by most desktop browsers: convert them to JPEG. The
 *  converter only loads when such a photo is picked. Null if it still can't be read. */
async function heicToJpeg(file: Blob): Promise<Blob | null> {
  try {
    const { default: heic2any } = await import("heic2any");
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    return Array.isArray(out) ? out[0] : out;
  } catch {
    return null;
  }
}

function load(blob: Blob): Promise<{ img: HTMLImageElement; done: () => void }> {
  const url = URL.createObjectURL(blob);
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res({ img, done: () => URL.revokeObjectURL(url) });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rej(new Error("not drawable"));
    };
    img.src = url;
  });
}

/** Redraw the picture at most `max` px on its long side, on white (so see-through PNGs don't go black). */
function redraw(img: HTMLImageElement, max: number) {
  const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * s));
  c.height = Math.max(1, Math.round(img.naturalHeight * s));
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

export type CheckedPhoto =
  /** preview: a small JPEG data URL ("" when this browser can't draw the photo); file: what joins the order. */
  | { ok: true; preview: string; file: File }
  | { ok: false; reason: string };

/** The quick checks, before anything is drawn: is it a photo at all, and is it a sensible size. */
export async function precheckPhoto(file: File): Promise<{ ok: true; kind: PhotoKind } | { ok: false; reason: string; notPhoto?: true }> {
  const name = safeName(file.name);
  if (file.size === 0) return { ok: false, reason: `“${name}” is empty, so it wasn’t added.` };
  const kind = await sniffPhoto(file).catch(() => null);
  if (!kind) return { ok: false, reason: `“${name}” isn’t a photo, so it wasn’t added.`, notPhoto: true };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, reason: `“${name}” is over 25 MB, so it wasn’t added. Try a smaller copy.` };
  const size = await headerSize(file, kind).catch(() => null);
  if (size && size[0] * size[1] > MAX_PHOTO_PIXELS) return { ok: false, reason: `“${name}” is too large to add. Try a smaller copy.` };
  return { ok: true, kind };
}

export async function checkPhoto(file: File, { preview = 360 } = {}): Promise<CheckedPhoto> {
  const name = safeName(file.name);
  const pre = await precheckPhoto(file);
  if (!pre.ok) return pre;
  const { kind } = pre;

  let picture = await load(file).catch(() => null);
  if (!picture && kind === "heic") {
    const jpeg = await heicToJpeg(file);
    if (jpeg) picture = await load(jpeg).catch(() => null);
  }
  if (!picture) {
    // A real photo format this browser can't draw (HEIC that wouldn't convert, TIFF): Mimi still gets it.
    if (kind === "heic" || kind === "tiff") return { ok: true, preview: "", file: new File([file], name, { type: kind === "heic" ? "image/heic" : "image/tiff" }) };
    return { ok: false, reason: `“${name}” couldn’t be opened as a photo, so it wasn’t added.` };
  }

  const { img, done } = picture;
  try {
    if (img.naturalWidth * img.naturalHeight > MAX_PHOTO_PIXELS) return { ok: false, reason: `“${name}” is too large to add. Try a smaller copy.` };
    const small = redraw(img, preview).toDataURL("image/jpeg", 0.78);
    const blob = await new Promise<Blob | null>((r) => redraw(img, KEEP_SIZE).toBlob(r, "image/jpeg", 0.88));
    if (!blob) return { ok: false, reason: `“${name}” couldn’t be opened as a photo, so it wasn’t added.` };
    return { ok: true, preview: small, file: new File([blob], `${name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" }) };
  } finally {
    done();
  }
}
