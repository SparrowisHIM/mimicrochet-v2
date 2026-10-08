"use client";

import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/** Headline that rises in word by word, then a hand-drawn underline draws under the marked words. */
export function WordReveal({ before, marked, after, className = "" }: { before: string; marked: string; after: string; className?: string }) {
  const reduce = useReducedMotion();
  let i = 0;
  const word = (w: string) => {
    const d = 0.15 + i++ * 0.055;
    return (
      <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
        <motion.span className="inline-block" initial={reduce ? false : { y: "105%" }} animate={{ y: 0 }} transition={{ duration: 0.75, ease, delay: d }}>
          {w}
        </motion.span>
      </span>
    );
  };
  const words = (s: string) => s.split(" ").filter(Boolean).flatMap((w, k, a) => [word(w), k < a.length - 1 ? " " : ""]);
  const lineDelay = 0.15 + (before.split(" ").length + marked.split(" ").length) * 0.055 + 0.35;
  return (
    <h1 className={className}>
      {words(before)}{" "}
      <span className="relative inline-block">
        {words(marked)}
        <svg className="absolute -bottom-[0.12em] left-0 h-[0.28em] w-full overflow-visible" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden>
          <motion.path
            d="M2 13 C 60 4, 120 18, 180 9 S 270 6, 298 11"
            fill="none"
            stroke="#d97706"
            strokeWidth="5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: lineDelay }}
          />
        </svg>
      </span>{" "}
      {words(after)}
    </h1>
  );
}

/** A marquee that drifts on its own, speeds up and reverses with your scroll, and leans with speed. */
export function VelocityMarquee({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(velocity, [-2000, 0, 2000], [-4, 0, 4], { clamp: false });
  const skew = useTransform(velocity, [-2000, 0, 2000], [4, 0, -4]);
  const dir = useRef(1);
  const track = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const onScreen = useInView(band);

  useAnimationFrame((_, delta) => {
    if (reduce || !onScreen) return;
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    const w = (track.current?.scrollWidth ?? 2000) / 2;
    let next = x.get() - dir.current * 40 * (delta / 1000) * (1 + Math.abs(f));
    if (next <= -w) next += w;
    if (next > 0) next -= w;
    x.set(next);
  });

  const row = (key: string) => (
    <span key={key} className="flex shrink-0 items-center" aria-hidden={key === "b"}>
      {items.map((t) => (
        <span key={t} className="flex items-center">
          <span className="px-7 font-serif text-[26px] whitespace-nowrap lg:text-[34px]">{t}</span>
          <span className="size-2 rounded-full bg-amber-600" />
        </span>
      ))}
    </span>
  );

  return (
    <div ref={band} className="overflow-hidden border-y border-stone-200 bg-white py-4 lg:py-5">
      <motion.div ref={track} className="flex w-max" style={{ x, skewX: reduce ? 0 : skew }}>
        {row("a")}
        {row("b")}
      </motion.div>
    </div>
  );
}

/** Each section wipes in from the top once as it reaches the screen. */
export function Wipe({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { clipPath: "inset(0 0 100% 0)", opacity: 0.4 }}
      whileInView={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.95, ease }}
    >
      {children}
    </motion.div>
  );
}

/** A looping clip of Mimi's that only plays while it's on screen; reduced motion keeps the still. */
export function InViewVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const onScreen = useInView(ref, { amount: 0.4 });
  useEffect(() => {
    const v = ref.current;
    if (!v || reduce) return;
    if (onScreen) v.play().catch(() => {});
    else v.pause();
  }, [onScreen, reduce]);
  return <video ref={ref} className="size-full object-cover" src={src} poster={poster} muted loop playsInline preload="none" aria-label={label} />;
}

/** The portrait drifts slowly inside its frame as you scroll; the frame stays put. */
export function Parallax({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.div className="absolute -inset-y-[8%] inset-x-0" style={{ y: reduce ? 0 : y }}>
        {children}
      </motion.div>
    </div>
  );
}

/** A yarn thread down the left edge that draws as you scroll; knots light up as you pass each section. Large screens only. */
export function ThreadRail({ knots }: { knots: number }) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const draw = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  if (reduce) return null;
  return (
    <div className="pointer-events-none fixed top-0 bottom-0 left-4 z-10 hidden w-6 xl:block" aria-hidden>
      <svg className="h-full w-full" viewBox="0 0 24 1000" preserveAspectRatio="none">
        <path d="M12 0 C 4 120, 20 240, 12 360 S 4 600, 12 720 S 20 900, 12 1000" fill="none" stroke="#e7e5e4" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <motion.path d="M12 0 C 4 120, 20 240, 12 360 S 4 600, 12 720 S 20 900, 12 1000" fill="none" stroke="#d97706" strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ pathLength: draw }} />
      </svg>
      {Array.from({ length: knots }, (_, i) => {
        const at = (i + 1) / (knots + 1);
        return <Knot key={i} at={at} progress={draw} />;
      })}
    </div>
  );
}

function Knot({ at, progress }: { at: number; progress: ReturnType<typeof useSpring> }) {
  const bg = useTransform(progress, [at - 0.02, at], ["#e7e5e4", "#d97706"]);
  const scale = useTransform(progress, [at - 0.02, at, at + 0.03], [1, 1.6, 1]);
  return <motion.span className="absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full" style={{ top: `${at * 100}%`, backgroundColor: bg, scale }} />;
}
