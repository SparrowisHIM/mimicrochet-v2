"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId } from "react";
import { Check } from "@/components/form/fields";
import { outlines, pieceKinds, type PieceKind } from "@/lib/fit-outline";

// "What is it?" (Figma "v2 · Design · Mobile / Desktop · 1 What to make · What is it?"): six picture
// tiles, so anyone can answer without reading. The drawings are the same ones the fit questions use,
// so the shirt picked here is the shirt they shape later.

const extra: Record<"hat" | "other", { body: string; detail: string }> = {
  hat: { body: "M16 84 Q50 98 84 84 Q76 80 73 64 Q69 38 50 38 Q31 38 27 64 Q24 80 16 84 Z", detail: "M27 70 Q50 78 73 70" },
  other: { body: "", detail: "" },
};

function Drawing({ kind }: { kind: PieceKind }) {
  if (kind === "other") {
    return (
      <svg viewBox="0 0 100 130" className="h-[75px] w-[58px]" aria-hidden>
        <circle cx="50" cy="62" r="30" className="fill-white stroke-stone-900" strokeWidth={2.4} strokeDasharray="6 5" />
        <path d="M41 52 Q41 41 50 41 Q60 41 60 50 Q60 57 52 60 Q50 61 50 66 V68" fill="none" className="stroke-stone-900" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="79" r="2.6" className="fill-stone-900" />
      </svg>
    );
  }
  const d = kind === "hat" ? extra.hat : outlines[kind](1, 1);
  return (
    <svg viewBox="0 0 100 130" className="h-[75px] w-[58px]" aria-hidden>
      <path d={d.body} className="fill-white stroke-stone-900" strokeWidth={2.4} strokeLinejoin="round" />
      <path d={d.detail} fill="none" className="stroke-stone-900" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function KindTiles({ value, onChange, invalid }: { value?: PieceKind; onChange: (k: PieceKind) => void; invalid?: boolean }) {
  const label = useId();
  return (
    <div className="flex flex-col gap-3">
      <span className="flex flex-col gap-0.5">
        <span id={label} className="text-[15px] font-semibold">
          What is it?
        </span>
        <span className="text-[14px] text-stone-500">Tap the picture that looks most like it.</span>
      </span>
      <div role="radiogroup" aria-labelledby={label} className="grid grid-cols-3 gap-2.5">
        {pieceKinds.map((k) => {
          const on = value === k.key;
          return (
            <motion.button
              key={k.key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(k.key)}
              whileTap={{ scale: 0.97 }}
              className={`relative flex flex-col items-center gap-1.5 rounded-[16px] bg-white px-1 pt-3 pb-3 transition-[border-color,box-shadow] duration-150 ${
                on ? "border-[1.5px] border-stone-900" : `border hover:border-stone-400 ${invalid ? "border-red-400" : "border-stone-200"}`
              }`}
            >
              <Drawing kind={k.key} />
              <span className="text-[14px] font-semibold text-balance text-center">{k.label}</span>
              <AnimatePresence>
                {on && (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.12 } }}
                    transition={{ type: "spring", stiffness: 500, damping: 26 }}
                    className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-stone-900 text-white"
                    aria-hidden
                  >
                    <Check size={12} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
