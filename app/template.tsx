"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// Page transitions. The template remounts on every navigation, so a cream curtain sits over
// the new page and lifts away, trailing a stitched amber thread. The header stays put above it.
// It's a separate overlay rather than a transform on the page, so fixed bars inside pages
// (like the custom order's action bar) never jump. The first load skips it.
let navigated = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const [play] = useState(() => navigated);
  const [done, setDone] = useState(false);

  useEffect(() => {
    navigated = true;
  }, []);

  return (
    <>
      {children}
      {play && !reduce && !done && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 top-0 bottom-0 z-30 bg-orange-50"
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1], delay: 0.05 }}
          onAnimationComplete={() => setDone(true)}
          aria-hidden
        >
          <motion.span
            className="absolute inset-x-0 bottom-0 h-[3px] bg-[repeating-linear-gradient(90deg,var(--color-amber-500)_0_14px,transparent_14px_22px)]"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 1, 0] }}
            transition={{ duration: 0.8, times: [0, 0.8, 1] }}
          />
        </motion.div>
      )}
    </>
  );
}
