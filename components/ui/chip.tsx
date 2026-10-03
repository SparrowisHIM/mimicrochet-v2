"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Chip({ on, onClick, children, className = "" }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <motion.button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex h-11 shrink-0 items-center rounded-full px-[18px] text-[15px] font-medium whitespace-nowrap transition-colors duration-200 ${
        on ? "bg-stone-900 text-orange-50" : "border border-stone-300 bg-white text-stone-900 hover:border-stone-900"
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}
