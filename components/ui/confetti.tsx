"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";

const colours = ["#f59e0b", "#f43f5e", "#10b981", "#fb923c", "#1c1917", "#fde68a"];

// Small seeded generator: the burst looks random but renders the same every time.
function seeded(seed: number) {
  let t = seed;
  return () => {
    t = (t * 1664525 + 1013904223) % 4294967296;
    return t / 4294967296;
  };
}

/** One small burst, fired once at a real moment (order sent, order paid). */
export function Confetti({ count = 28 }: { count?: number }) {
  const reduce = useReducedMotion();
  const bits = useMemo(() => {
    const rand = seeded(count * 7919);
    return Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + rand() * 0.4;
        const dist = 90 + rand() * 120;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 60,
          r: rand() * 540 - 270,
          c: colours[i % colours.length],
          w: 6 + rand() * 5,
          h: 3 + rand() * 4,
          d: rand() * 0.12,
        };
      });
  }, [count]);
  if (reduce) return null;
  return (
    <span className="pointer-events-none absolute top-1/2 left-1/2 z-10" aria-hidden>
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute block rounded-[1px]"
          style={{ width: b.w, height: b.h, background: b.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 140], opacity: [1, 1, 0], rotate: b.r, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: b.d, times: [0, 0.45, 1] }}
        />
      ))}
    </span>
  );
}
