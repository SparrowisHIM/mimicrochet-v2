"use client";

import { motion } from "motion/react";

/** The glossy toggle: the site's one tactile control (Figma component "Toggle"). */
export function Toggle({
  checked,
  onChange,
  label,
  id,
  hideLabel = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  id?: string;
  hideLabel?: boolean;
}) {
  return (
    <label htmlFor={id} className="group inline-flex cursor-pointer items-center gap-3 select-none">
      <span className={hideLabel ? "sr-only" : "text-[15px] font-medium whitespace-nowrap text-stone-900"}>{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative h-8 w-14 shrink-0 rounded-full"
      >
        <span
          className={`absolute inset-0 rounded-full shadow-[inset_0_1.5px_3px_rgb(0_0_0/0.18)] transition-[background-color,filter] duration-300 group-hover:brightness-95 ${
            checked ? "bg-linear-to-b from-emerald-600 to-emerald-400" : "bg-linear-to-b from-stone-300 to-stone-200"
          }`}
        />
        <motion.span
          className={`absolute top-[3px] left-[3px] block size-[26px] rounded-full border-[0.5px] shadow-[0_2px_4px_rgb(0_0_0/0.22),0_6px_10px_rgb(0_0_0/0.1)] ${
            checked ? "border-emerald-200 bg-linear-to-b from-white to-emerald-50" : "border-stone-200 bg-linear-to-b from-white to-stone-100"
          }`}
          animate={{ x: checked ? 24 : 0 }}
          whileTap={{ scaleX: 1.15 }}
          transition={{ type: "spring", stiffness: 600, damping: 32 }}
        >
          <span className="absolute top-1 left-[5px] h-1.5 w-2.5 rounded-full bg-white/95 blur-[1.5px]" />
        </motion.span>
      </button>
    </label>
  );
}
