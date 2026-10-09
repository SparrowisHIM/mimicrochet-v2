"use client";

import Image from "next/image";
import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import { useRef } from "react";

/**
 * A band of Mimi's pieces: names in large serif with a small photo between each.
 * It drifts on its own, speeds up and reverses with your scroll, and leans with the speed.
 * Decorative only (the same pieces are linked in the grid above).
 */
export function PieceMarquee({ pieces }: { pieces: { name: string; image: string }[] }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(velocity, [-2400, 0, 2400], [-5, 0, 5], { clamp: false });
  const skew = useTransform(velocity, [-2400, 0, 2400], [6, 0, -6]);
  const dir = useRef(1);
  const track = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const onScreen = useInView(band);

  useAnimationFrame((_, delta) => {
    if (reduce || !onScreen) return;
    const f = factor.get();
    if (f < -0.05) dir.current = -1;
    else if (f > 0.05) dir.current = 1;
    const w = (track.current?.scrollWidth ?? 3000) / 2;
    let next = x.get() - dir.current * 55 * (delta / 1000) * (1 + Math.abs(f));
    if (next <= -w) next += w;
    if (next > 0) next -= w;
    x.set(next);
  });

  const row = (key: string) => (
    <span key={key} className="flex shrink-0 items-center">
      {pieces.map((p) => (
        <span key={p.name} className="flex items-center">
          <span className="px-6 font-serif text-[34px] leading-none whitespace-nowrap lg:px-9 lg:text-[64px]">{p.name}</span>
          <span className="relative block h-12 w-9 shrink-0 -rotate-6 overflow-hidden rounded-[8px] bg-orange-100 shadow-[0_10px_24px_-12px_rgb(28_25_23/0.5)] lg:h-[84px] lg:w-[64px] lg:rounded-[8px]">
            <Image src={p.image} alt="" fill sizes="64px" className="object-cover" />
          </span>
        </span>
      ))}
    </span>
  );

  return (
    <div ref={band} className="overflow-hidden border-y border-stone-200/80 bg-white py-6 lg:py-9" aria-hidden>
      <motion.div ref={track} className="flex w-max" style={{ x, skewX: reduce ? 0 : skew }}>
        {row("a")}
        {row("b")}
      </motion.div>
    </div>
  );
}
