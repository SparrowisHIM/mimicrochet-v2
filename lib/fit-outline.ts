// The little line drawing under the fit mat (Figma: "The picture under the fit mat"). It isn't a photo:
// each kind of piece is drawn from two numbers, how wide (w) and how long (l), so it can be redrawn
// every time the pin moves. 1, 1 is the piece like the picture. Drawn in a 100 × 130 box.

export type FitKind = "set" | "dress" | "shirt" | "top";

/** Which drawing a shop category gets. Anything we can't tell (their own photo or idea) gets the dress. */
export function kindOf(category?: string): FitKind {
  if (category === "Shirts") return "shirt";
  if (category === "Tops & knits") return "top";
  if (category === "Sets & shorts") return "set";
  return "dress";
}

const f = (n: number) => n.toFixed(1);

export const outlines: Record<FitKind, (w: number, l: number) => { body: string; detail: string }> = {
  // a halter top over a skirt
  set(w, l) {
    const hem = 40 + 60 * l;
    const hh = 8 + 16 * w;
    return {
      body: `M44 10 L56 10 L${f(50 + 16 * w)} 30 Q50 34 ${f(50 - 16 * w)} 30 Z M${f(50 - 12 * w)} 40 L${f(50 + 12 * w)} 40 L${f(50 + hh)} ${f(hem)} Q50 ${f(hem + 3)} ${f(50 - hh)} ${f(hem)} Z`,
      detail: `M${f(50 - 12 * w)} 44 L${f(50 + 12 * w)} 44`,
    };
  },
  // sleeveless, fitted at the waist, flaring to the hem
  dress(w, l) {
    const hem = 8 + 92 * l;
    const hh = 10 + 18 * w;
    return {
      body: `M40 8 Q50 20 60 8 L66 9 Q${f(50 + 15 * w)} 20 ${f(50 + 15 * w)} 30 L${f(50 + 12 * w)} 44 L${f(50 + hh)} ${f(hem)} Q50 ${f(hem + 4)} ${f(50 - hh)} ${f(hem)} L${f(50 - 12 * w)} 44 L${f(50 - 15 * w)} 30 Q${f(50 - 15 * w)} 20 34 9 Z`,
      detail: `M${f(50 - 12 * w)} 44 L${f(50 + 12 * w)} 44`,
    };
  },
  // short sleeves, a collar and a button line
  shirt(w, l) {
    const hem = 10 + 78 * l;
    return {
      body: `M42 10 Q50 18 58 10 L${f(50 + 22 * w)} 14 L${f(50 + 30 * w + 8)} 34 L${f(50 + 27 * w + 2)} 40 L${f(50 + 20 * w)} 32 L${f(50 + 21 * w)} ${f(hem)} Q50 ${f(hem + 3)} ${f(50 - 21 * w)} ${f(hem)} L${f(50 - 20 * w)} 32 L${f(50 - 27 * w - 2)} 40 L${f(50 - 30 * w - 8)} 34 L${f(50 - 22 * w)} 14 Z`,
      detail: `M42 10 L46 20 L50 15 L54 20 L58 10 M50 17 L50 ${f(hem - 3)}`,
    };
  },
  // long sleeves and a ribbed hem
  top(w, l) {
    const hem = 10 + 64 * l;
    return {
      body: `M41 10 Q50 16 59 10 L${f(50 + 20 * w)} 13 L${f(50 + 30 * w + 6)} 70 L${f(50 + 24 * w + 4)} 72 L${f(50 + 18 * w)} 34 L${f(50 + 19 * w)} ${f(hem)} L${f(50 - 19 * w)} ${f(hem)} L${f(50 - 18 * w)} 34 L${f(50 - 24 * w - 4)} 72 L${f(50 - 30 * w - 6)} 70 L${f(50 - 20 * w)} 13 Z`,
      detail: `M${f(50 - 19 * w)} ${f(hem - 5)} L${f(50 + 19 * w)} ${f(hem - 5)}`,
    };
  },
};

// How wide and how long for each place on the mat, -2 to 2, in between included (the pin moves smoothly).
// The steps are generous on purpose, so the change is easy to see on a small drawing.
const widths = [0.72, 0.86, 1, 1.18, 1.38];
const lengths = [0.68, 0.84, 1, 1.16, 1.32];
const along = (stops: number[], v: number) => {
  const t = Math.max(0, Math.min(4, v + 2));
  const i = Math.min(3, Math.floor(t));
  return stops[i] + (stops[i + 1] - stops[i]) * (t - i);
};
export const widthAt = (x: number) => along(widths, x);
export const lengthAt = (y: number) => along(lengths, y);
