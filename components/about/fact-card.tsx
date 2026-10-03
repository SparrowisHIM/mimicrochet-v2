"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef } from "react";

/** A card with a stitched border that draws itself in, a warm sheen that follows the cursor, and a small lift. */
export function FactCard({ title, text }: { title: string; text: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || !ref.current) return;
    ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative flex h-full flex-col gap-2.5 rounded-[22px] bg-white p-6 lg:p-7"
      style={{ backgroundImage: "radial-gradient(260px circle at var(--mx, -200px) var(--my, -200px), rgb(254 243 199 / 0.9), transparent 70%)" }}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[22px] border-[1.5px] border-dashed border-orange-300"
        initial={reduce ? false : { clipPath: "inset(0 100% 100% 0 round 22px)" }}
        whileInView={{ clipPath: "inset(0 0% 0% 0 round 22px)" }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />
      <h3 className="relative font-serif text-[26px] leading-tight lg:text-[28px]">{title}</h3>
      <p className="relative text-[16px] leading-[1.5] text-stone-600">{text}</p>
    </motion.div>
  );
}
