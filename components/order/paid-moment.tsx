"use client";

import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/ui/confetti";
import { formatNaira } from "@/lib/site";

// The thread a ball of yarn unwinds as it rolls: a loose curl, one chain-stitch loop, then a tick (in a 220 x 140 box).
const THREAD = "M14 84 C 30 84 38 56 58 60 C 76 64 72 92 56 90 C 40 88 48 66 68 68 C 79 69 87 78 97 88 L 113 104 L 184 32";
const AMBER = "#d97706";
const EMERALD = "#047857";
const ease = [0.65, 0, 0.35, 1] as const;

/**
 * Back from Paystack, once: a ball of yarn rolls in and unwinds into a tick, the tick turns green with a ring and a
 * burst, the amount counts up, then the whole moment lifts away like a curtain onto the order page. A tap skips it.
 * Reduced motion: nothing here; the page itself says it's paid.
 */
export function PaidMoment({ title, amount, note, onDone }: { title: string; amount: number; note: string; onDone: () => void }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(true);
  const [ticked, setTicked] = useState(false);
  const path = useRef<SVGPathElement>(null);
  const progress = useMotionValue(0);
  const counted = useMotionValue(0);
  const shown = useTransform(counted, (v) => formatNaira(Math.round(v / 50) * 50));
  // The ball rides the thread's leading end, turning as it rolls and shrinking as the yarn leaves it.
  const point = (v: number) => {
    const p = path.current;
    return p ? p.getPointAtLength(v * p.getTotalLength()) : { x: 14, y: 84 };
  };
  const ballX = useTransform(progress, (v) => point(v).x);
  const ballY = useTransform(progress, (v) => point(v).y);
  const ballTurn = useTransform(progress, [0, 1], [0, 900]);
  const ballSize = useTransform(progress, [0, 0.85, 1], [1, 0.55, 0.2]);
  const ballFade = useTransform(progress, [0, 0.9, 1], [1, 1, 0]);

  useEffect(() => {
    if (reduce) return onDone();
    const draw = animate(progress, 1, { duration: 1.05, ease, delay: 0.25 });
    let count: ReturnType<typeof animate> | undefined;
    const t1 = setTimeout(() => {
      setTicked(true);
      navigator.vibrate?.([10, 40, 16]);
      count = animate(counted, amount, { duration: 0.9, ease: [0.19, 1, 0.22, 1] });
    }, 1300);
    const t2 = setTimeout(() => setOpen(false), 3500);
    return () => {
      draw.stop();
      count?.stop();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduce, progress, counted, amount, onDone]);

  // Skip with a tap or Escape.
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  if (reduce) return null;
  return (
    <AnimatePresence onExitComplete={onDone}>
      {open && (
        <motion.div
          key="paid"
          role="status"
          aria-live="polite"
          aria-label={`${title}. ${formatNaira(amount)}. ${note}`}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[70] flex cursor-pointer flex-col items-center justify-center gap-6 bg-orange-50 px-6 text-center"
          // Covers the page from the first frame (it comes straight from Paystack's redirect).
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)", transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
        >
          <motion.div
            className="relative h-[168px] w-[264px] lg:h-[196px] lg:w-[308px]"
            animate={ticked ? { scale: [1, 1.07, 1] } : { scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden
          >
            {ticked && (
              <motion.span
                className="absolute top-1/2 left-1/2 size-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-500"
                initial={{ scale: 0.4, opacity: 0.5 }}
                animate={{ scale: 1.35, opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            )}
            <svg viewBox="0 0 220 140" className="absolute inset-0 size-full overflow-visible" fill="none">
              {/* the faint guide the thread is about to follow, so the eye knows where it's going */}
              <path d={THREAD} stroke="#e7e5e4" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 7" opacity={ticked ? 0 : 1} style={{ transition: "opacity 0.3s" }} />
              <motion.path
                ref={path}
                d={THREAD}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pathLength: progress }}
                initial={{ stroke: AMBER }}
                animate={{ stroke: ticked ? EMERALD : AMBER }}
                transition={{ duration: 0.35 }}
              />
              {/* the ball of yarn: a disc with two wraps, rolling along the leading end */}
              <motion.g style={{ x: ballX, y: ballY, opacity: ballFade }}>
                <motion.g style={{ rotate: ballTurn, scale: ballSize }}>
                  <circle r="13" fill={AMBER} />
                  <path d="M-11 -5 C -4 -10 6 -9 11 -3 M-12 3 C -4 -2 7 -1 12 6 M-6 11 C -2 4 4 -3 3 -12" stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" />
                </motion.g>
              </motion.g>
            </svg>
            {ticked && <Confetti count={26} />}
          </motion.div>

          <div className="flex flex-col items-center gap-2">
            <motion.h2
              className="font-serif text-[40px] leading-[1.05] tracking-[-0.01em] text-balance lg:text-[56px]"
              initial={{ opacity: 0, y: 14 }}
              animate={ticked ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {title}
            </motion.h2>
            <motion.span
              className="text-[34px] leading-none font-semibold tracking-[-0.01em] text-emerald-800 tabular-nums lg:text-[44px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: ticked ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
            >
              {shown}
            </motion.span>
            <motion.p
              className="max-w-[320px] pt-1 text-[16px] leading-[1.5] text-stone-600"
              initial={{ opacity: 0, y: 8 }}
              animate={ticked ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {note}
            </motion.p>
          </div>
          <motion.span
            className="absolute bottom-[max(28px,env(safe-area-inset-bottom))] text-[13px] text-stone-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: ticked ? 1 : 0 }}
            transition={{ delay: 0.6 }}
          >
            Tap to see your order
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
