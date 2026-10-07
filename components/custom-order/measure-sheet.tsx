"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Ruler } from "@/components/custom-order/ruler";
import { Button, linkClass } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

export type Measures = { bust?: number; waist?: number; hips?: number; length?: number };
export type MeasureKey = keyof Measures;

export const measureSteps: { key: MeasureKey; label: string; help: string; start: number; min: number; max: number }[] = [
  { key: "bust", label: "Bust", help: "Around the fullest part of your chest. Keep the tape level and snug, not tight.", start: 86, min: 60, max: 150 },
  { key: "waist", label: "Waist", help: "Around the narrowest part of your waist, usually just above the belly button.", start: 70, min: 50, max: 140 },
  { key: "hips", label: "Hips", help: "Around the fullest part of your hips and bottom, feet together.", start: 94, min: 70, max: 160 },
  { key: "length", label: "Length", help: "From the top of the shoulder down to where you want the piece to end.", start: 80, min: 20, max: 160 },
];

const toIn = (cm: number) => Math.round((cm / 2.54) * 2) / 2;

export function MeasureSheet({
  open,
  startAt,
  values,
  unit,
  onUnit,
  onSave,
  onClose,
}: {
  open: boolean;
  startAt: MeasureKey;
  values: Measures;
  unit: "cm" | "in";
  onUnit: (u: "cm" | "in") => void;
  onSave: (key: MeasureKey, cm: number) => void;
  onClose: () => void;
}) {
  const [i, setI] = useState(() => measureSteps.findIndex((s) => s.key === startAt));
  const s = measureSteps[Math.max(0, i)];
  const [cm, setCm] = useState(values[s.key] ?? s.start);

  const moveTo = (next: number) => {
    if (next >= measureSteps.length) return onClose();
    const n = measureSteps[next];
    setI(next);
    setCm(values[n.key] ?? n.start);
  };
  const go = (next: number) => {
    onSave(s.key, cm);
    moveTo(next);
  };

  const shown = unit === "cm" ? cm : toIn(cm);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="bottom"
      title={s.label}
      footer={
        <div className="flex items-center gap-4">
          <button type="button" className={`${linkClass} px-3`} onClick={() => moveTo(i + 1)}>
            Skip
          </button>
          <Button className="flex-1" onClick={() => go(i + 1)}>
            {i + 1 < measureSteps.length ? `Next: ${measureSteps[i + 1].label}` : "Done"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-[18px]">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={s.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="pr-6 text-[15px] leading-[1.5] text-stone-600">
              {s.help}
            </motion.p>
          </AnimatePresence>
          <span className="shrink-0 text-[14px] font-medium text-stone-500">
            {i + 1} of {measureSteps.length}
          </span>
        </div>
        <Ruler key={s.key + unit} label={`${s.label} in ${unit}`} value={cm} min={s.min} max={s.max} onChange={setCm} />
        <p className="flex items-baseline justify-center gap-1.5" aria-live="polite">
          <span className="font-serif text-[64px] leading-none tabular-nums">{shown}</span>
          <span className="text-[18px] font-medium text-stone-500">{unit}</span>
        </p>
        <div className="flex justify-center">
          <div className="flex gap-0.5 rounded-full bg-orange-100 p-[3px]" role="radiogroup" aria-label="Unit">
            {(["cm", "in"] as const).map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={unit === u}
                onClick={() => onUnit(u)}
                className={`rounded-full px-[18px] py-[7px] text-[14px] transition-colors ${unit === u ? "bg-white font-semibold shadow-sm" : "font-medium text-stone-500"}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2.5 rounded-[14px] bg-amber-100 px-3.5 py-3 text-[13px] leading-[1.45] text-amber-800">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-px shrink-0" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Mimi makes your piece to these numbers. If they’re wrong, it can’t be remade for free.
        </div>
      </div>
    </Sheet>
  );
}

export function formatMeasure(cm: number | undefined, unit: "cm" | "in") {
  if (cm === undefined) return "";
  return unit === "cm" ? `${cm}` : `${toIn(cm)}`;
}
