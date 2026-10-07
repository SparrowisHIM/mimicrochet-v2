"use client";

import { AnimatePresence, motion } from "motion/react";

// The shop's Filter control: no pill, just a sliders icon and the word. On hover the slider knobs
// slide along their lines (a hint of what's inside); a small dark count after the word shows how many are on.

export function FilterButton({ count, onClick, className = "" }: { count: number; onClick: () => void; className?: string }) {
  const knob = "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count ? `Filter, ${count} on` : "Filter"}
      className={`group inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-[15px] font-semibold text-stone-900 transition-colors duration-200 hover:bg-stone-900/[0.06] ${className}`}
    >
      <span className="grid">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="14" cy="6" r="2.4" fill="var(--color-orange-50)" stroke="currentColor" strokeWidth="1.6" className={`${knob} group-hover:-translate-x-[6px]`} />
          <circle cx="7.5" cy="11" r="2.4" fill="var(--color-orange-50)" stroke="currentColor" strokeWidth="1.6" className={`${knob} group-hover:translate-x-[7px]`} />
          <circle cx="12" cy="16" r="2.4" fill="var(--color-orange-50)" stroke="currentColor" strokeWidth="1.6" className={`${knob} group-hover:-translate-x-[4px]`} />
        </svg>
      </span>
      Filter
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            className="grid h-5 min-w-5 place-items-center rounded-full bg-stone-900 px-1.5 text-[12px] leading-none font-semibold text-orange-50 tabular-nums"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.3 }}
            aria-hidden
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
