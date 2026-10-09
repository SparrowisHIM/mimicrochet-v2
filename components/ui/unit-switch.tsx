"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

// cm / in: a squircle switch between the two units (after Cloudflare Kumo's switch), in Mimi's caramel,
// the amber-800 that marks "made for you" across the site. The thumb springs across, and while the
// track is pressed it stretches toward the side it's about to go. Either word can be tapped too, and
// arrow keys move between them like a native radio group.

export type Unit = "cm" | "in";

const SIZES = {
  sm: { track: "h-[22px] w-[38px] rounded-[8px]", thumb: 22, radius: 7, travel: 16, word: "h-9 text-[13px]" },
  md: { track: "h-[26px] w-[46px] rounded-[9px]", thumb: 26, radius: 8, travel: 20, word: "h-11 text-[15px]" },
};

export function UnitSwitch({ value, onChange, size = "md" }: { value: Unit; onChange: (u: Unit) => void; size?: "sm" | "md" }) {
  const reduce = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const s = SIZES[size];
  const on = value === "in";
  const stretch = pressed && !reduce ? 5 : 0;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 520, damping: 34 };
  const word = (u: Unit) => (
    <button
      type="button"
      role="radio"
      aria-checked={u === value}
      tabIndex={u === value ? 0 : -1}
      onClick={() => onChange(u)}
      className={`flex items-center px-1 font-semibold transition-colors duration-200 ${s.word} ${u === value ? "text-stone-900" : "text-stone-400 hover:text-stone-700"}`}
    >
      {u}
    </button>
  );
  return (
    <div
      role="radiogroup"
      aria-label="Unit"
      onKeyDown={(e) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
          e.preventDefault();
          onChange(on ? "cm" : "in");
          const next = e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")[on ? 0 : 1];
          next?.focus();
        }
      }}
      className="inline-flex shrink-0 items-center gap-1"
    >
      {word("cm")}
      <span
        aria-hidden
        onClick={() => onChange(on ? "cm" : "in")}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        className={`relative block shrink-0 cursor-pointer border border-amber-900/80 bg-amber-800 shadow-[inset_0_1px_2px_rgb(69_26_3/0.35)] ${s.track}`}
      >
        <motion.span
          className="absolute -top-px -left-px bg-white shadow-[0_0_0_0.5px_rgb(69_26_3/0.35),0_1px_3px_rgb(69_26_3/0.35)]"
          style={{ height: s.thumb, borderRadius: s.radius }}
          initial={false}
          animate={{ width: s.thumb + stretch, x: on ? s.travel - stretch : 0 }}
          transition={spring}
        />
      </span>
      {word("in")}
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
