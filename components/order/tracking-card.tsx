"use client";

import { AnimatePresence, motion } from "motion/react";
import { stages } from "@/lib/stages";

export function TrackingCard({
  orderId,
  piece,
  stage,
  note,
  noteFrom = "Latest from Mimi",
  status,
  className = "",
}: {
  orderId: string;
  piece: string;
  /** 0-based stage index; -1 before Mimi has the request (nothing filled in yet). */
  stage: number;
  /** Replaces the stage name in the pill, in a neutral colour (e.g. "Not sent yet"). */
  status?: string;
  note: string;
  noteFrom?: string;
  className?: string;
}) {
  const s = stages[Math.max(0, stage)];
  const emerald = !status && s.tone === "emerald";

  return (
    <div
      className={`flex flex-col gap-4 rounded-[22px] border border-stone-200 bg-white px-[22px] pt-5 pb-[22px] shadow-[0_24px_48px_-12px_rgb(28_25_23/0.18)] ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-stone-500">Order {orderId}</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={status ?? s.key}
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-full px-3 py-1.5 text-[13px] leading-none font-semibold ${
              status ? "bg-stone-100 text-stone-700" : emerald ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {status ?? s.label}
          </motion.span>
        </AnimatePresence>
      </div>

      <p className="font-serif text-[22px] leading-tight">{piece}</p>

      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5" aria-hidden>
          {stages.map((st, i) => (
            <span key={st.key} className="relative h-1 flex-1 overflow-hidden rounded-full bg-stone-200">
              <motion.span
                className="absolute inset-0 origin-left rounded-full bg-stone-900"
                initial={false}
                animate={{ scaleX: i <= stage ? 1 : 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i <= stage ? 0.05 * i : 0 }}
              />
            </span>
          ))}
        </div>
        <span className="text-[13px] font-medium text-stone-500">
          {stage < 0 ? "Starts when Mimi gets it" : `Step ${stage + 1} of ${stages.length}`}
        </span>
      </div>

      <div className="flex gap-3 border-t border-stone-100 pt-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-orange-100 font-serif text-[15px] text-amber-800">M</span>
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span className="text-[13px] font-semibold">{noteFrom}</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={note}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-[15px] leading-snug text-stone-600"
            >
              {note}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
