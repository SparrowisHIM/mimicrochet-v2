import { useSyncExternalStore } from "react";
import type { Measures } from "@/components/custom-order/measure-sheet";

// How a customer likes a piece to fit, from the custom order's fit questions. x runs tight (-2) to
// loose (+2), y runs short (-2) to long (+2); 0, 0 is the piece like the picture. The words are kept
// plain on purpose, so anyone can follow them.
export type Fit = { x: number; y: number };

/** Everything the fit questions collect. Kept on the customer's own phone so their next order starts with it. */
export type SavedFit = { size?: string; height?: number; measures: Measures; unit: "cm" | "in"; fit?: Fit };

const widths = ["Very tight", "A bit tight", "", "A bit loose", "Very loose"];
const lengths = ["very short", "a bit short", "", "a bit long", "very long"];

/** "A bit tight, a bit long" in plain words, for the customer, Mimi and the WhatsApp message. */
export function fitWords({ x, y }: Fit) {
  const w = widths[x + 2];
  const l = lengths[y + 2];
  if (!w && !l) return "Like the picture";
  if (!l) return w;
  if (!w) return l[0].toUpperCase() + l.slice(1);
  return `${w}, ${l}`;
}

export const heightLabel = (cm: number, unit: "cm" | "in") => {
  if (unit === "cm") return `${cm} cm`;
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)} ft ${inches % 12} in`;
};

// v2: fits saved before 10 Oct could hold the tape's old ready-made numbers (tapped through, never measured).
const KEY = "mimi:fit:v2";
const listeners = new Set<() => void>();
let seen: string | null | undefined;
let cached: SavedFit | null = null;

function read(): SavedFit | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (raw !== seen) {
    seen = raw;
    try {
      const f = raw ? (JSON.parse(raw) as SavedFit) : null;
      cached = f && typeof f === "object" && f.measures ? f : null;
    } catch {
      cached = null;
    }
  }
  return cached;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The fit this phone remembers from the customer's last order, or null. */
export const useSavedFit = () => useSyncExternalStore(subscribe, read, () => null);

export function saveFit(f: SavedFit) {
  try {
    localStorage.setItem(KEY, JSON.stringify(f));
  } catch {
    // Private mode or full storage: the order still carries the fit, it just isn't remembered.
  }
  listeners.forEach((l) => l());
}

/** True when there's anything worth showing as "your fit". */
export const hasFit = (f: Pick<SavedFit, "height" | "measures" | "fit">) => Boolean(f.height || f.fit || Object.keys(f.measures).length);
