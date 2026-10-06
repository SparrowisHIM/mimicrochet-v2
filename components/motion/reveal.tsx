"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

type Tag = "h1" | "h2" | "h3" | "p";

/**
 * A heading that rises in word by word from behind a mask, with a slight tilt that settles
 * as each word lands. Plays once when it reaches the screen ("\n" starts a new line).
 */
export function RevealText({
  text,
  as: As = "h2",
  className = "",
  id,
  delay = 0,
  immediate = false,
}: {
  text: string;
  as?: Tag;
  className?: string;
  id?: string;
  delay?: number;
  /** Play on mount instead of on scroll (for headings at the top of a page). */
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLHeadingElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const play = immediate || seen;
  let n = 0;
  const lines = text.split("\n");
  return (
    <As ref={ref} id={id} className={className} aria-label={text.replace(/\n/g, " ")}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden>
          {line.split(" ").map((w, wi, all) => {
            const d = delay + n++ * 0.05;
            return (
              <span key={wi} className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom">
                <motion.span
                  className="inline-block origin-bottom-left will-change-transform"
                  initial={reduce ? false : { y: "110%", rotate: 7 }}
                  animate={play ? { y: "0%", rotate: 0 } : undefined}
                  transition={{ duration: 0.7, ease, delay: d }}
                >
                  {w}
                </motion.span>
                {wi < all.length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      ))}
    </As>
  );
}

/** A block that rises into place once as it reaches the screen. */
export function Reveal({ children, className = "", delay = 0, y = 20 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ type: "spring", stiffness: 140, damping: 22, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Curtain reveal for cards in a grid: the card is uncovered from the bottom up while it
 * rises, staggered by column so a row lands left to right.
 */
export function Curtain({ children, index = 0, columns = 4, className = "" }: { children: ReactNode; index?: number; columns?: number; className?: string }) {
  const reduce = useReducedMotion();
  const col = index % columns;
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0% round 18px)", y: 32 }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0% round 0px)", y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, ease, delay: col * 0.07 }}
    >
      {children}
    </motion.div>
  );
}
