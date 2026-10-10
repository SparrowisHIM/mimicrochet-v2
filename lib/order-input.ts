import type { PieceKind } from "@/lib/fit-outline";

// What the custom order form sends to the server. The server checks every field again
// (lib/server/order-input.ts): the form's own checks can be skipped by anyone posting directly.

export const budgetOptions = ["Under ₦30k", "₦30k–60k", "₦60k–100k", "Over ₦100k"] as const;

export type CustomOrderInput = {
  piece: { source: "product" | "idea" | "story"; slug: string; name: string; image?: string; note?: string } | null;
  /** What it is, when it started from their own photo or words. */
  pieceKind?: PieceKind;
  photoCount: number;
  hasVoiceNote: boolean;
  description?: string;
  size?: string;
  measurements?: { bust?: number; waist?: number; hips?: number; length?: number; unit: "cm" | "in" };
  height?: number;
  fit?: { x: number; y: number };
  colours: "photo" | "different";
  colourNote?: string;
  when: string;
  budget?: string;
  notes?: string;
  name: string;
  /** Digits after +234, e.g. "8012345678". */
  phone: string;
  state: string;
  area: string;
};
