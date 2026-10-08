"use client";

import { AnimatePresence, motion, useInView, useReducedMotion, type Variants } from "motion/react";
import { useRef } from "react";

// The five order stages as small animated line icons, in the site's MingCute style (2px rounded
// strokes on a 24 grid). MingCute has no yarn, so the yarn ball follows Tabler's. Each icon plays its
// moment once when its stage comes up: the camera flashes and snaps, the notes stack up, the hook
// works the yarn, the dress draws itself finished, and Mimi's bag drops in sealed.

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const centre = { transformBox: "fill-box", transformOrigin: "center" } as const;
const inOut = [0.65, 0, 0.35, 1] as const;

/** A stroke that draws itself in. */
const draw = (delay: number, duration = 0.5): Variants => ({
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1, transition: { pathLength: { delay, duration, ease: inOut }, opacity: { delay, duration: 0.01 } } },
});

/** Idea received: the flash fires, then the shutter snaps. */
function Camera() {
  const ray: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    show: { pathLength: [0, 1, 1], opacity: [0, 1, 0], transition: { delay: 0.25, duration: 0.75, times: [0, 0.3, 1] } },
  };
  return (
    <>
      <motion.g variants={{ hidden: { y: 0 }, show: { y: [0, 0.8, 0], transition: { delay: 0.5, duration: 0.35 } } }}>
        <path {...line} d="M2 10a2 2 0 0 1 2-2h2.2l1.3-1.9a1.5 1.5 0 0 1 1.24-.66h3.52a1.5 1.5 0 0 1 1.24.66L14.8 8H17a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
        <motion.circle
          {...line}
          cx="10.5"
          cy="13.9"
          r="3.2"
          style={centre}
          variants={{ hidden: { scale: 1 }, show: { scale: [1, 0.5, 1], transition: { delay: 0.5, duration: 0.45, times: [0, 0.3, 1], ease: "easeOut" } } }}
        />
        <motion.circle
          cx="15.9"
          cy="10.9"
          r="0.9"
          fill="currentColor"
          style={centre}
          variants={{ hidden: { scale: 1 }, show: { scale: [1, 2, 1], transition: { delay: 0.22, duration: 0.4 } } }}
        />
      </motion.g>
      <motion.path {...line} d="M20.2 3.1V1.6" variants={ray} />
      <motion.path {...line} d="M21.2 3.6l1-1" variants={ray} />
      <motion.path {...line} d="M21.7 4.6h1.4" variants={ray} />
    </>
  );
}

/** Price agreed: a note slides onto the stack and its seal draws. */
function Cash() {
  return (
    <>
      <motion.path {...line} d="M5 4.5h14" variants={{ hidden: { y: 3, opacity: 0 }, show: { y: 0, opacity: 1, transition: { delay: 0.3, duration: 0.35, ease: "easeOut" } } }} />
      <motion.g
        style={centre}
        variants={{ hidden: { y: 8, rotate: -10, opacity: 0 }, show: { y: 0, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 380, damping: 22 } } }}
      >
        <path {...line} d="M4.5 7.5h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" />
        <motion.circle {...line} cx="12" cy="13.5" r="2.6" variants={draw(0.4, 0.5)} />
        <motion.path
          {...line}
          d="M6.4 13.5h.01M17.6 13.5h.01"
          style={centre}
          variants={{ hidden: { scale: 0 }, show: { scale: 1, transition: { delay: 0.75, type: "spring", stiffness: 500, damping: 18 } } }}
        />
      </motion.g>
    </>
  );
}

/** In progress: the yarn ball rolls in and turns as the hook works two stitches. */
function Yarn() {
  const t = [0, 0.3, 0.45, 0.6, 0.75, 0.9];
  return (
    <>
      <motion.g
        style={centre}
        variants={{
          hidden: { x: -5, rotate: -120, opacity: 0 },
          show: { x: 0, opacity: 1, rotate: [-120, 0, 0, -18, -18, -36], transition: { x: { type: "spring", stiffness: 260, damping: 22 }, opacity: { duration: 0.2 }, rotate: { duration: 1.5, times: t, ease: "easeOut" } } },
        }}
      >
        <circle {...line} cx="9.5" cy="14.5" r="6.5" />
        <path {...line} d="M16 14.5A6.5 6.5 0 0 0 9.5 21M14.94 10.95A10.11 10.11 0 0 0 5.94 19.94M10.59 12.46A10.11 10.11 0 0 0 4.06 10.95" />
      </motion.g>
      <motion.path
        {...line}
        d="M14.4 9.6 20.6 3.4a1.3 1.3 0 0 1 1.84 1.84"
        variants={{
          hidden: { x: 4, y: -4, opacity: 0 },
          show: { x: [4, 0, -1.2, 0, -1.2, 0], y: [-4, 0, 1.2, 0, 1.2, 0], opacity: 1, transition: { delay: 0.15, duration: 1.5, times: t, ease: "easeInOut", opacity: { delay: 0.15, duration: 0.2 } } },
        }}
      />
    </>
  );
}

/** Ready: the dress draws itself, the waist goes in, and a sparkle says it's done. */
function Dress() {
  return (
    <>
      <motion.path
        {...line}
        d="M9.17 3H9a4 4 0 0 0-4 4v.5a.5.5 0 0 0 .5.5H8a1 1 0 0 1 1 1v.948a3 3 0 0 1-.657 1.874l-2.028 2.535A6 6 0 0 0 5 18.105V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-.895a6 6 0 0 0-1.315-3.748l-2.028-2.535A3 3 0 0 1 15 9.948V9a1 1 0 0 1 1-1h2.5a.5.5 0 0 0 .5-.5V7a4 4 0 0 0-4-4h-.17a3.001 3.001 0 0 1-5.66 0"
        variants={draw(0, 0.9)}
      />
      <motion.path {...line} d="M9.01 11h5.98" variants={draw(0.75, 0.25)} />
      <motion.path
        d="M21 .6c.25 1.25.95 1.95 2.2 2.2-1.25.25-1.95.95-2.2 2.2-.25-1.25-.95-1.95-2.2-2.2 1.25-.25 1.95-.95 2.2-2.2z"
        fill="currentColor"
        style={centre}
        variants={{ hidden: { scale: 0, rotate: -90, opacity: 0 }, show: { scale: [0, 1.3, 1], rotate: 0, opacity: 1, transition: { delay: 0.95, duration: 0.45 } } }}
      />
    </>
  );
}

/** Delivered: Mimi's bag drops in, its handle swings, and the tick seals it. */
function Bag() {
  return (
    <motion.g variants={{ hidden: { y: -8, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 420, damping: 17 } } }}>
      <motion.path
        {...line}
        d="M9 9V6a3 3 0 1 1 6 0v3"
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
        variants={{ hidden: { rotate: -16 }, show: { rotate: [-16, 10, -5, 0], transition: { delay: 0.12, duration: 0.75 } } }}
      />
      <path {...line} d="M5.536 21h12.928a1 1 0 0 0 .999-1.036l-.429-12A1 1 0 0 0 18.035 7H5.965a1 1 0 0 0-1 .964l-.428 12a1 1 0 0 0 1 1.036Z" />
      <motion.path {...line} d="M9.2 14.3l2 2 3.6-3.6" variants={draw(0.45, 0.35)} />
    </motion.g>
  );
}

const icons = [Camera, Cash, Yarn, Dress, Bag];

/** The stage's icon in a soft round badge: amber while the piece is being made, green once it's ready. */
export function StageIcon({ stage, size = 20, className = "" }: { stage: number; size?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.8 });
  const Icon = icons[Math.min(icons.length - 1, Math.max(0, stage))];
  return (
    <span
      ref={ref}
      className={`relative grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-300 ${stage >= 3 ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-amber-900"} ${className}`}
      aria-hidden
    >
      <AnimatePresence mode="popLayout">
        <motion.span key={stage} className="grid place-items-center" exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}>
          <motion.svg width={size} height={size} viewBox="0 0 24 24" overflow="visible" initial={reduce ? false : "hidden"} animate={seen || reduce ? "show" : "hidden"}>
            <Icon />
          </motion.svg>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
