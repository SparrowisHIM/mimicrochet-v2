"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useId, useRef } from "react";

// cm / in: shaped like the size chips, with a warm amber thumb that slides to the chosen unit.
// Arrow keys move between the two, like a native radio group.

export type Unit = "cm" | "in";

export function UnitSwitch({ value, onChange, size = "md" }: { value: Unit; onChange: (u: Unit) => void; size?: "sm" | "md" }) {
  const id = useId();
  const reduce = useReducedMotion();
  const units: Unit[] = ["cm", "in"];
  const sm = size === "sm";
  return (
    <div
      role="radiogroup"
      aria-label="Unit"
      onKeyDown={(e) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
          e.preventDefault();
          onChange(value === "cm" ? "in" : "cm");
        }
      }}
      className={`relative grid shrink-0 grid-cols-2 rounded-full border border-stone-300 bg-white p-[3px] ${sm ? "h-9 w-[92px]" : "h-11 w-[124px]"}`}
    >
      {units.map((u) => {
        const on = u === value;
        return (
          <button
            key={u}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(u)}
            className={`relative z-10 rounded-full font-semibold transition-colors duration-200 ${sm ? "text-[13px]" : "text-[15px]"} ${on ? "text-amber-950" : "text-stone-500 hover:text-stone-900"}`}
          >
            {on && (
              <motion.span
                layoutId={`${id}-thumb`}
                className="absolute inset-0 -z-10 rounded-full bg-linear-to-b from-amber-300 to-amber-400 shadow-[inset_0_1px_0_rgb(255_255_255/0.5),0_2px_6px_-2px_rgb(180_83_9/0.5)]"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 34 }}
              />
            )}
            {u}
          </button>
        );
      })}
    </div>
  );
}

/** A number that counts across to its new value when `countOn` changes (86 cm becomes 34 in, ticking
 *  down), and simply follows it otherwise (dragging the ruler stays instant). */
export function CountingNumber({ value, countOn, className = "" }: { value: number; countOn: string; className?: string }) {
  const reduce = useReducedMotion();
  const n = useMotionValue(value);
  const text = useTransform(n, (v) => (Math.round(v * 2) / 2).toString());
  const last = useRef(countOn);
  useEffect(() => {
    if (last.current === countOn || reduce) {
      last.current = countOn;
      n.jump(value);
      return;
    }
    last.current = countOn;
    const a = animate(n, value, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
    return () => a.stop();
  }, [value, countOn, reduce, n]);
  return <motion.span className={`tabular-nums ${className}`}>{text}</motion.span>;
}
