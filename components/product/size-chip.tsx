"use client";

import { motion, useReducedMotion } from "motion/react";

/** In-stock size on the photo. Grows from a dot when the card scrolls into view. */
export function SizeChip({ size }: { size: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      initial={reduce ? false : { scale: 0, opacity: 0 }}
      whileInView={{ scale: [0, 1.08, 1], opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="inline-grid h-6 origin-center place-items-center rounded-full bg-white/94 px-2.5 text-[12px] font-semibold text-stone-900 shadow-[0_2px_8px_rgb(28_25_23/0.10)] backdrop-blur-sm lg:h-[31px] lg:px-[11px] lg:text-[14px]"
      aria-label={`In stock in size ${size}`}
    >
      {size}
    </motion.span>
  );
}
