"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Chip } from "@/components/ui/chip";

// "By a date" calendar for custom orders. The days between today and the chosen date fill in
// as Mimi's making time, the selection glides between days, and rush days are marked before
// you pick them. Everything works from the keyboard too.

const DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const startOfDay = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const plus = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY);

export const longDate = (iso: string) => fromISO(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
export const shortDate = (iso: string) => fromISO(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const quick: [string, number][] = [
  ["In 2 weeks", 14],
  ["In 3 weeks", 21],
  ["In a month", 30],
  ["In 6 weeks", 42],
];

function monthGrid(view: Date) {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d));
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));
}

export function DatePicker({
  id,
  value,
  onChange,
  now,
  minDays = 1,
  rushDays = 14,
  maxDays = 183,
}: {
  id?: string;
  value?: string;
  onChange: (iso: string) => void;
  /** Today's time, passed in so rendering stays pure. */
  now: number;
  minDays?: number;
  rushDays?: number;
  maxDays?: number;
}) {
  const reduce = useReducedMotion();
  const today = startOfDay(now);
  const min = plus(today, minDays);
  const rushEnd = plus(today, rushDays);
  const max = plus(today, maxDays);
  const selected = value ? fromISO(value) : null;

  const [view, setView] = useState(() => {
    const d = selected ?? min;
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [dir, setDir] = useState(1);
  const [focusISO, setFocusISO] = useState(() => toISO(selected ?? min));
  const keyed = useRef(false);
  const grid = useRef<HTMLDivElement>(null);

  // After keyboard moves, put focus on the newly active day.
  useEffect(() => {
    if (!keyed.current) return;
    keyed.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${focusISO}"]`)?.focus();
  }, [focusISO, view]);

  const canPrev = view > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = view < new Date(max.getFullYear(), max.getMonth(), 1);
  const showMonth = (d: Date) => {
    const next = new Date(d.getFullYear(), d.getMonth(), 1);
    if (next.getTime() === view.getTime()) return;
    setDir(next > view ? 1 : -1);
    setView(next);
    const firstAvailable = next < min ? min : next;
    setFocusISO(toISO(firstAvailable));
  };
  const choose = (d: Date) => {
    if (d < min || d > max) return;
    onChange(toISO(d));
    showMonth(d);
    setFocusISO(toISO(d));
  };
  const nav = (e: React.KeyboardEvent) => {
    const cur = fromISO(focusISO);
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: Date | null = null;
    if (e.key in step) next = plus(cur, step[e.key]);
    else if (e.key === "Home") next = plus(cur, -((cur.getDay() + 6) % 7));
    else if (e.key === "End") next = plus(cur, 6 - ((cur.getDay() + 6) % 7));
    else if (e.key === "PageUp") next = new Date(cur.getFullYear(), cur.getMonth() - 1, cur.getDate());
    else if (e.key === "PageDown") next = new Date(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
    if (!next) return;
    e.preventDefault();
    if (next < min) next = min;
    if (next > max) next = max;
    keyed.current = true;
    showMonth(next);
    setFocusISO(toISO(next));
  };

  const days = selected ? daysBetween(today, selected) : 0;
  const rush = selected ? selected < rushEnd : false;
  const rows = monthGrid(view);
  const monthLabel = view.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-3">
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
        {quick.map(([label, n]) => (
          <Chip key={label} on={value === toISO(plus(today, n))} onClick={() => choose(plus(today, n))}>
            {label}
          </Chip>
        ))}
      </div>

      <div id={id} className="overflow-hidden rounded-[22px] border border-stone-200 bg-white shadow-[0_18px_40px_-28px_rgb(28_25_23/0.35)]">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 lg:px-5">
          <div className="relative h-8 flex-1 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.span
                key={monthLabel}
                custom={dir}
                className="absolute inset-0 font-serif text-[22px] leading-8"
                initial={reduce ? { opacity: 0 } : { y: dir * 26, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { y: dir * -26, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                aria-live="polite"
              >
                {monthLabel}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="flex gap-1.5">
            {[-1, 1].map((d) => (
              <motion.button
                key={d}
                type="button"
                whileTap={{ scale: 0.9 }}
                disabled={d < 0 ? !canPrev : !canNext}
                onClick={() => showMonth(new Date(view.getFullYear(), view.getMonth() + d, 1))}
                className="grid size-9 place-items-center rounded-full border border-stone-200 transition-colors hover:border-stone-900 disabled:pointer-events-none disabled:opacity-30"
                aria-label={d < 0 ? "Previous month" : "Next month"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className={d < 0 ? "rotate-180" : ""}>
                  <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 px-2.5 lg:px-3.5" aria-hidden>
          {weekdays.map((w) => (
            <span key={w} className="py-1.5 text-center text-[12px] font-semibold text-stone-400">
              {w}
            </span>
          ))}
        </div>

        <LayoutGroup id={`cal-${id ?? "date"}`}>
          <div className="relative px-2.5 pb-3 lg:px-3.5" onKeyDown={nav} ref={grid}>
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.div
                key={monthLabel}
                custom={dir}
                role="grid"
                aria-label={monthLabel}
                initial={reduce ? { opacity: 0 } : { x: dir * 56, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { x: dir * -56, opacity: 0 }}
                transition={{ type: "spring", stiffness: 340, damping: 34 }}
                className="flex flex-col gap-0.5"
              >
                {rows.map((row, r) => (
                  <div key={r} role="row" className="grid grid-cols-7">
                    {row.map((d, c) => {
                      if (!d) return <span key={c} role="gridcell" />;
                      const iso = toISO(d);
                      const off = d < min || d > max;
                      const isToday = d.getTime() === today.getTime();
                      const isSel = selected?.getTime() === d.getTime();
                      const inBand = selected ? d > today && d <= selected : false;
                      const bandStart = inBand && (c === 0 || d.getDate() === 1 || plus(d, -1).getTime() === today.getTime());
                      const bandEnd = inBand && (c === 6 || isSel || plus(d, 1).getMonth() !== d.getMonth());
                      const isRush = !off && d < rushEnd;
                      const n = daysBetween(today, d);
                      return (
                        <div key={iso} role="gridcell" aria-selected={isSel} className="relative h-11 lg:h-12">
                          <motion.span
                            className={`absolute inset-x-0 inset-y-1.5 origin-left bg-amber-100 ${bandStart ? "rounded-l-full" : ""} ${bandEnd ? "rounded-r-full" : ""}`}
                            initial={false}
                            animate={{ scaleX: inBand ? 1 : 0, opacity: inBand ? 1 : 0 }}
                            transition={reduce ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: inBand ? Math.min(n, 60) * 0.012 : 0 }}
                            aria-hidden
                          />
                          <button
                            type="button"
                            data-iso={iso}
                            tabIndex={iso === focusISO ? 0 : -1}
                            disabled={off}
                            onClick={() => choose(d)}
                            onFocus={() => setFocusISO(iso)}
                            aria-label={`${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${isRush ? ", rush order" : ""}${off && d < min ? ", too soon" : ""}`}
                            className={`group relative mx-auto grid h-11 w-full max-w-12 place-items-center rounded-full text-[15px] tabular-nums outline-none lg:h-12 ${
                              off ? "cursor-not-allowed text-stone-300" : "cursor-pointer text-stone-900"
                            } focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-1`}
                          >
                            {!off && !isSel && <span className="absolute inset-1 rounded-full transition-colors group-hover:bg-stone-100" aria-hidden />}
                            {isToday && !isSel && <span className="absolute inset-1 rounded-full border-[1.5px] border-stone-900" aria-hidden />}
                            {isSel && (
                              <motion.span
                                layoutId="selected-day"
                                className="absolute inset-0.5 rounded-full bg-stone-900 shadow-[0_8px_18px_-6px_rgb(28_25_23/0.55)]"
                                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 34 }}
                                aria-hidden
                              />
                            )}
                            <span className={`relative ${isSel ? "font-semibold text-orange-50" : isToday ? "font-semibold" : ""}`}>{d.getDate()}</span>
                            {isRush && !isSel && <span className="absolute bottom-1.5 size-1 rounded-full bg-amber-600" aria-hidden />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </LayoutGroup>

        <div className="flex flex-col gap-3 border-t border-stone-100 bg-stone-50/70 px-4 py-3.5 lg:px-5">
          <AnimatePresence mode="wait" initial={false}>
            {selected ? (
              <motion.div
                key="picked"
                className="flex items-end justify-between gap-3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
              >
                <span className="flex flex-col">
                  <span className="text-[13px] font-medium text-stone-500">Your requested date</span>
                  <span className="text-[17px] font-semibold">{longDate(value!)}</span>
                </span>
                <span className="flex items-baseline gap-1.5 text-right">
                  <span className="relative inline-flex h-8 overflow-hidden font-serif text-[28px] leading-8 tabular-nums">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span key={days} initial={reduce ? false : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -24, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 32 }}>
                        {days}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="text-[13px] leading-tight text-stone-500">
                    days
                    <br />
                    from today
                  </span>
                </span>
              </motion.div>
            ) : (
              <motion.p key="empty" className="text-[14px] text-stone-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Pick the day you’d like it. Mimi confirms the timing with you on WhatsApp.
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-medium text-stone-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-full bg-amber-100" aria-hidden /> Time until your date
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-600" aria-hidden /> Rush (under 2 weeks)
            </span>
            <span className="ml-auto hidden items-center gap-1 lg:flex">
              <kbd className="rounded-[5px] border border-stone-200 bg-white px-1 text-[11px]">←</kbd>
              <kbd className="rounded-[5px] border border-stone-200 bg-white px-1 text-[11px]">→</kbd> to move
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {rush && (
          <motion.p
            className="overflow-hidden rounded-[14px] bg-amber-100 px-4 py-3 text-[14px] leading-[1.45] text-amber-900"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span className="font-semibold">A little sooner?</span> Mimi will check whether she can meet this date and agree any rush fee with you before you pay.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
