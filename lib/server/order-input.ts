import "server-only";
import { pieceKinds, type PieceKind } from "@/lib/fit-outline";
import { isNigerianState } from "@/lib/nigeria";
import { budgetOptions, type CustomOrderInput } from "@/lib/order-input";
import { pieceFromCustomer, pieceFromIdea, pieceFromProduct } from "@/lib/pieces";
import { getProduct } from "@/lib/products";
import { ideas } from "@/lib/ideas";
import { customers } from "@/lib/customers";
import { sizeLabels } from "@/lib/sizes";
import { isName, isNigerianMobile } from "@/lib/validate";

// The server's own check of a custom order. Anything the form would never send is refused, and text is
// trimmed, capped and stripped of control and right-to-left characters, so what reaches Mimi is plain.

export type CleanCustomOrder = Omit<CustomOrderInput, "piece"> & {
  piece: { source: "product" | "idea" | "story" | "photo" | "words"; slug?: string; name: string; image?: string; price?: number | null; note?: string };
};

type Result = { ok: true; order: CleanCustomOrder } | { ok: false; error: string };

const unsafeChars = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‎‏‪-‮⁦-⁩]/g;

function text(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.replace(unsafeChars, "").trim();
  return t ? t.slice(0, max) : undefined;
}

const num = (v: unknown, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : undefined);
const kinds = new Set<string>(pieceKinds.map((k) => k.key));

/** The piece comes from the site's own data when it names one, so a request can't invent a name, price or picture. */
function cleanPiece(p: CustomOrderInput["piece"], photoCount: number, kind?: PieceKind): CleanCustomOrder["piece"] | null {
  if (p === null) {
    const label = kind ? pieceKinds.find((k) => k.key === kind)!.label : null;
    const from = photoCount ? "from your photo" : "(your own idea)";
    return { source: photoCount ? "photo" : "words", name: label ? `${label} ${from}` : photoCount ? "From your photo" : "Your own idea" };
  }
  if (typeof p !== "object" || typeof p.slug !== "string") return null;
  const product = p.source === "product" ? getProduct(p.slug) : undefined;
  const idea = p.source === "idea" ? ideas.find((i) => i.slug === p.slug) : undefined;
  const customer = p.source === "story" ? customers.find((c) => c.slug === p.slug) : undefined;
  const known = product ? pieceFromProduct(product) : idea ? pieceFromIdea(idea) : customer ? pieceFromCustomer(customer) : null;
  return known && { source: known.source, slug: known.slug, name: known.name, image: known.image, price: known.price, note: known.note };
}

export function parseCustomOrder(raw: unknown): Result {
  if (!raw || typeof raw !== "object") return { ok: false, error: "No order details." };
  const r = raw as Partial<CustomOrderInput>;

  const photoCount = num(r.photoCount, 0, 6) ?? 0;
  const pieceKind = typeof r.pieceKind === "string" && kinds.has(r.pieceKind) ? (r.pieceKind as PieceKind) : undefined;
  const piece = cleanPiece(r.piece ?? null, photoCount, pieceKind);
  if (!piece) return { ok: false, error: "That piece isn't on the site." };

  const name = text(r.name, 60);
  if (!name || !isName(name)) return { ok: false, error: "Add your name." };
  const phone = typeof r.phone === "string" ? r.phone.replace(/\D/g, "") : "";
  if (!isNigerianMobile(phone)) return { ok: false, error: "Add a Nigerian WhatsApp number." };
  const state = text(r.state, 40);
  if (!state || !isNigerianState(state)) return { ok: false, error: "Choose your state." };
  const area = text(r.area, 120);
  if (!area) return { ok: false, error: "Choose your area." };

  const colours = r.colours === "photo" || r.colours === "different" ? r.colours : null;
  if (!colours) return { ok: false, error: "Choose the colours." };
  const when = text(r.when, 40);
  if (!when || !(when === "No rush" || /^By [\p{L}\d ,]+$/u.test(when))) return { ok: false, error: "Choose when you need it." };

  const description = text(r.description, 1500);
  if (piece.source === "words" && !description && !r.hasVoiceNote) return { ok: false, error: "Tell Mimi about it." };

  const size = typeof r.size === "string" && (sizeLabels as readonly string[]).includes(r.size) ? r.size : undefined;
  const m = r.measurements;
  const measurements =
    m && typeof m === "object" && (m.unit === "cm" || m.unit === "in")
      ? { unit: m.unit, bust: num(m.bust, 1, 300), waist: num(m.waist, 1, 300), hips: num(m.hips, 1, 300), length: num(m.length, 1, 300) }
      : undefined;
  const hasMeasure = measurements && (measurements.bust || measurements.waist || measurements.hips || measurements.length);
  const fit = r.fit && typeof r.fit === "object" ? { x: num(r.fit.x, -2, 2), y: num(r.fit.y, -2, 2) } : undefined;

  return {
    ok: true,
    order: {
      piece,
      pieceKind,
      photoCount,
      hasVoiceNote: r.hasVoiceNote === true,
      description,
      size,
      measurements: hasMeasure ? measurements : undefined,
      height: num(r.height, 1, 250),
      fit: fit && fit.x !== undefined && fit.y !== undefined ? { x: fit.x, y: fit.y } : undefined,
      colours,
      colourNote: colours === "different" ? text(r.colourNote, 80) : undefined,
      when,
      budget: typeof r.budget === "string" && (budgetOptions as readonly string[]).includes(r.budget) ? r.budget : undefined,
      notes: text(r.notes, 500),
      name,
      phone,
      state,
      area,
    },
  };
}
