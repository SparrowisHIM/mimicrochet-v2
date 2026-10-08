import { colourGroups, type ColourGroup } from "@/lib/products";

// Matches any shade someone drags to in the colour picker against the shop's colour groups, by how
// close they look (OKLab distance), so "a dusty rose" finds the pink pieces and "olive" the green ones.

const reps: Record<ColourGroup, string> = {
  Red: "#dc2626",
  Pink: "#ec4899",
  Yellow: "#facc15",
  Green: "#4d7c0f",
  Blue: "#2563eb",
  Purple: "#a855f7",
  Black: "#1c1917",
  Cream: "#f5ecd7",
};

function toLinear(c: number) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function hexToOklab(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [toLinear((n >> 16) & 255), toLinear((n >> 8) & 255), toLinear(n & 255)];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

/** The colour group (or two, when it sits between them) that looks closest to this shade. */
export function matchShade(hex: string): ColourGroup[] {
  const [L, A, B] = hexToOklab(hex);
  const scored = colourGroups
    .map((g) => {
      const [l, a, b] = hexToOklab(reps[g]);
      return { g, d: Math.hypot((L - l) * 1.2, A - a, B - b) };
    })
    .sort((x, y) => x.d - y.d);
  return scored.filter((s, i) => i === 0 || (i === 1 && s.d < scored[0].d * 1.25)).map((s) => s.g);
}

export function hsvToHex(h: number, s: number, v: number) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return `#${[f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("")}`;
}
