import "server-only";
import sharp from "sharp";
import { MAX_UPLOAD_BYTES } from "@/lib/order-files";

// The server's own check of every uploaded file (the browser's checks in lib/upload-safety.ts can be
// skipped by anyone posting directly). A file is judged by its first bytes, never its name or the type
// the browser claims. Photos are redrawn from their pixels as a fresh JPEG, which drops anything hidden
// in the file (scripts, extra data, the GPS position in EXIF). Voice notes can't be redrawn, so only
// real audio containers are kept, under a fixed type.

export { MAX_UPLOAD_BYTES };
const MAX_PIXELS = 100_000_000;
/** Photos are kept at most this many pixels on their long side: plenty for Mimi to see the detail. */
const KEEP_SIZE = 2048;

const startsWith = (b: Buffer, bytes: number[], at = 0) => bytes.every((x, i) => b[at + i] === x);
const ascii = (b: Buffer, from: number, to: number) => b.subarray(from, to).toString("latin1");

function photoKind(b: Buffer) {
  if (startsWith(b, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return "webp";
  if (ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a") return "gif";
  if (startsWith(b, [0x49, 0x49, 0x2a, 0x00]) || startsWith(b, [0x4d, 0x4d, 0x00, 0x2a])) return "tiff";
  if (ascii(b, 4, 8) === "ftyp" && /^(avif|avis|heic|heix|heim|heis|hevc|hevx|mif1|msf1)$/.test(ascii(b, 8, 12))) return "heif";
  return null;
}

export type CheckedPhoto = { ok: true; data: Buffer; width: number; height: number } | { ok: false; reason: string };

export async function checkPhoto(b: Buffer): Promise<CheckedPhoto> {
  if (b.length === 0 || b.length > MAX_UPLOAD_BYTES) return { ok: false, reason: "too big" };
  if (!photoKind(b)) return { ok: false, reason: "not a photo" };
  try {
    // limitInputPixels refuses a decompression bomb from its header, before decoding it.
    const { data, info } = await sharp(b, { limitInputPixels: MAX_PIXELS, failOn: "error" })
      .rotate()
      .resize(KEEP_SIZE, KEEP_SIZE, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    return { ok: true, data, width: info.width, height: info.height };
  } catch {
    // Some iPhone HEIC photos can't be read here; Mimi still gets them on WhatsApp.
    return { ok: false, reason: "can't read" };
  }
}

export type CheckedVoice = { ok: true; data: Buffer; contentType: string } | { ok: false; reason: string };

export function checkVoice(b: Buffer): CheckedVoice {
  if (b.length === 0 || b.length > MAX_UPLOAD_BYTES) return { ok: false, reason: "too big" };
  if (startsWith(b, [0x1a, 0x45, 0xdf, 0xa3])) return { ok: true, data: b, contentType: "audio/webm" };
  if (ascii(b, 4, 8) === "ftyp" && /^(M4A |mp42|isom|iso5|iso6|mp41|dash)$/.test(ascii(b, 8, 12))) return { ok: true, data: b, contentType: "audio/mp4" };
  if (ascii(b, 0, 4) === "OggS") return { ok: true, data: b, contentType: "audio/ogg" };
  return { ok: false, reason: "not a voice note" };
}
