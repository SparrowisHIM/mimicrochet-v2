"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { CloseIcon } from "@/components/icons";

// One photo the customer added. It shows the moment it's picked: blurred and soft while it's being
// prepared, with a light passing over it. When it's ready, a bright line scans down and leaves the
// sharp photo behind it; then the "Main" label and the remove button arrive.

const sweep = [0.65, 0, 0.35, 1] as const; // an on-screen sweep: eases in and out
const REVEAL = 0.75;

export function PhotoTile({ src, ready, index, onRemove }: { src: string; ready: boolean; index: number; onRemove: () => void }) {
  const reduce = Boolean(useReducedMotion());
  // Tiles that arrive already prepared (coming back to this step) skip the reveal.
  const [arrivedPending] = useState(!ready);
  const revealing = ready && arrivedPending && !reduce;

  return (
    <>
      {/* The soft version underneath, so the sharp one can be revealed over it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover blur-[10px] brightness-110 saturate-[0.35]" />
      <motion.img
        src={src}
        alt={`Your photo ${index + 1}`}
        className="absolute inset-0 size-full object-cover"
        initial={false}
        animate={{ clipPath: ready ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" }}
        transition={{ duration: reduce ? 0 : REVEAL, ease: sweep }}
      />

      {/* Preparing: a soft band of light keeps passing down the photo. */}
      <AnimatePresence>
        {!ready && !reduce && (
          <motion.span key="shimmer" className="tile-shimmer pointer-events-none absolute inset-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} aria-hidden>
            <span />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Ready: the scan line leads the reveal down the photo, then fades. */}
      {revealing && (
        <motion.span
          className="pointer-events-none absolute inset-x-0 h-0.5 -translate-y-1/2 bg-white shadow-[0_0_14px_3px_rgb(255_255_255/0.85),0_0_32px_8px_rgb(251_191_36/0.35)]"
          initial={{ top: "0%", opacity: 1 }}
          animate={{ top: "100%", opacity: [1, 1, 0] }}
          transition={{ top: { duration: REVEAL, ease: sweep }, opacity: { duration: REVEAL, times: [0, 0.8, 1] } }}
          aria-hidden
        />
      )}

      <AnimatePresence mode="popLayout" initial={false}>
        {!ready ? (
          <motion.span
            key="adding"
            className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-white/92 px-2 py-0.5 text-[12px] font-semibold text-stone-900"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
            role="status"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-amber-500" aria-hidden />
            Adding
          </motion.span>
        ) : index === 0 ? (
          <motion.span
            key="main"
            className="absolute bottom-2 left-2 rounded-full bg-white/92 px-2 py-0.5 text-[12px] font-semibold text-stone-900"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: revealing ? REVEAL * 0.8 : 0 }}
          >
            Main
          </motion.span>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {ready && (
          <motion.button
            key="remove"
            type="button"
            onClick={onRemove}
            aria-label={`Remove photo ${index + 1}`}
            className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-white/92 text-stone-900 shadow-[0_2px_8px_rgb(28_25_23/0.18)] transition-transform duration-150 active:scale-90"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.2, delay: revealing ? REVEAL * 0.85 : 0 }}
          >
            <CloseIcon size={15} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
