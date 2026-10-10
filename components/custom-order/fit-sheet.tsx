"use client";

import { AnimatePresence, motion, useMotionValue } from "motion/react";
import { useRef, useState } from "react";
import { FitPad, FitPicture } from "@/components/custom-order/fit-pad";
import { measureSteps, toIn, type MeasureKey, type Measures } from "@/components/custom-order/measure-sheet";
import { Ruler } from "@/components/custom-order/ruler";
import { ChevronIcon } from "@/components/icons";
import { Button, linkClass } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { CountingNumber, UnitSwitch } from "@/components/ui/unit-switch";
import { fitWords, heightLabel, type Fit } from "@/lib/fit";
import type { FitKind } from "@/lib/fit-outline";
import { sizeChart } from "@/lib/sizes";
import { useMedia } from "@/lib/use-media";

// "Make it fit you": the custom order's fit questions, one at a time (Figma "v2 · Design · Mobile ·
// 2 Make it yours · Fit · 1–7" and the desktop fit panel). Height, the four measurements on the tape,
// how it should fit on the blocking mat, then a check of every answer. On desktop it opens as a wider
// panel with the answers filling in beside the question.
//
// Nothing is filled in for them: every tape starts at 0 (or at the number they gave before). 0 means
// not measured, so Next at 0 skips the question and nothing is sent for it; a ready-made number would
// let someone tap through and send Mimi measurements they never took. Back is on every question, and
// the number can be typed as well as dragged.

export type FitStep = "height" | MeasureKey | "fit" | "check";
export type FitAnswers = { size?: string; height?: number; measures: Measures; unit: "cm" | "in"; fit?: Fit };

/** Usual range for height; the tape runs from 0 to max. */
const HEIGHT = { min: 120, max: 210 };
const steps: FitStep[] = ["height", ...measureSteps.map((m) => m.key), "fit", "check"];
const measure = (s: FitStep) => measureSteps.find((m) => m.key === s);
const title = (s: FitStep) => (s === "height" ? "Height" : s === "fit" ? "How it fits" : s === "check" ? "Your fit" : measure(s)!.label);
const help = (s: FitStep) =>
  s === "height"
    ? "Stand straight against a wall, without shoes."
    : s === "fit"
      ? "Drag the pin. The middle is the piece like the picture."
      : s === "check"
        ? "Check it over. Tap a line to change it."
        : measure(s)!.help;

const cmText = (v: number, unit: "cm" | "in") => (unit === "cm" ? `${v} cm` : `${toIn(v)} in`);
const smallLink =
  "inline-flex items-center gap-1.5 text-[14px] font-medium text-stone-600 underline decoration-stone-600/30 decoration-[1.5px] underline-offset-[5px] transition-[text-decoration-color] duration-200 hover:decoration-stone-600";

export function FitSheet({
  open,
  startAt,
  kind,
  answers,
  onChange,
  onSave,
  onClose,
}: {
  open: boolean;
  startAt: FitStep;
  /** Which drawing of the piece to show under the mat. */
  kind: FitKind;
  answers: FitAnswers;
  onChange: (patch: Partial<FitAnswers>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const desktop = useMedia("(min-width: 1024px)");
  const [i, setI] = useState(() => Math.max(0, steps.indexOf(startAt)));
  const step = steps[i];
  // What the tape shows: their own number if they've given one, otherwise 0 (not measured).
  const startOf = (s: FitStep) => (s === "height" ? (answers.height ?? 0) : measure(s) ? (answers.measures[s as MeasureKey] ?? 0) : 0);
  const [cm, setCm] = useState(() => startOf(steps[Math.max(0, steps.indexOf(startAt))]));
  const [skipped, setSkipped] = useState<FitStep[]>([]);
  // A number typed into the big figure: the tape rolls to it and reports the numbers on the way.
  const [jump, setJump] = useState<{ value: number; id: number }>();
  const [why, setWhy] = useState(false);
  // Where the pin is right now, for the drawing under the mat.
  const pinX = useMotionValue(answers.fit?.x ?? 0);
  const pinY = useMotionValue(answers.fit?.y ?? 0);

  const goTo = (n: number) => {
    setI(n);
    setCm(startOf(steps[n]));
    setJump(undefined);
    setWhy(false);
  };
  /** Keep what's on the tape: a number they set, or nothing at all when it's at 0. */
  const keep = () => {
    if (step === "height") onChange({ height: cm > 0 ? cm : undefined });
    else if (measure(step)) {
      const measures = { ...answers.measures };
      if (cm > 0) measures[step as MeasureKey] = cm;
      else delete measures[step as MeasureKey];
      onChange({ measures });
    }
  };
  /** Next: at 0 the question counts as skipped. On the mat, moving on without dragging means "like the picture". */
  const next = () => {
    keep();
    if (step === "fit" && !answers.fit) onChange({ fit: { x: 0, y: 0 } });
    const empty = (step === "height" || Boolean(measure(step))) && cm === 0;
    setSkipped((s) => (empty ? (s.includes(step) ? s : [...s, step]) : s.filter((k) => k !== step)));
    goTo(i + 1);
  };
  /** Back keeps what they've set here; from the first question it returns to the order. */
  const back = () => {
    keep();
    if (i === 0) onClose();
    else goTo(i - 1);
  };

  /** What each answer says, or empty if there's none yet. */
  const answer = (s: FitStep | "size") => {
    if (s === "size") {
      const row = sizeChart.find((r) => r.size === answers.size);
      return row ? `${row.size} · UK ${row.uk}` : "";
    }
    if (s === "height") return answers.height ? heightLabel(answers.height, answers.unit) : "";
    if (s === "fit") return answers.fit ? fitWords(answers.fit) : "";
    if (measure(s)) {
      const v = answers.measures[s as MeasureKey];
      return v ? cmText(v, answers.unit) : "";
    }
    return "";
  };

  const bars = (
    <div className="flex gap-1" role="group" aria-label="Fit questions">
      {steps.map((s, n) => (
        <button key={s} type="button" onClick={() => goTo(n)} className="group flex-1 py-2" aria-label={`Go to ${title(s)}`} aria-current={n === i ? "step" : undefined}>
          <span className={`block h-1 rounded-full transition-colors duration-300 ${n <= i ? "bg-stone-900" : "bg-stone-200 group-hover:bg-stone-300"}`} />
        </button>
      ))}
    </div>
  );

  const unitSwitch = (
    <div className="flex justify-center">
      <UnitSwitch value={answers.unit} onChange={(unit) => onChange({ unit })} />
    </div>
  );

  const body = () => {
    if (step === "fit") {
      return (
        <>
          <FitPad value={answers.fit ?? { x: 0, y: 0 }} onChange={(fit) => onChange({ fit })} live={{ x: pinX, y: pinY }} />
          {/* The drawing of their piece changes as the pin moves; the words say the same thing */}
          <div className="flex items-center gap-4">
            <FitPicture kind={kind} x={pinX} y={pinY} />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="font-serif text-[22px] leading-tight text-balance lg:text-[24px]" aria-live="polite">
                {fitWords(answers.fit ?? { x: 0, y: 0 })}.
              </p>
              <p className="text-[13px] leading-[1.4] text-stone-500">The dashed line is the piece like the picture.</p>
            </div>
          </div>
        </>
      );
    }
    if (step === "check") {
      const rows: [FitStep | "size", string][] = [["size", "Size"], ...steps.filter((s) => s !== "check").map((s) => [s, title(s)] as [FitStep, string])];
      return (
        <>
          <ul className="overflow-hidden rounded-[22px] border border-stone-200 bg-white">
            {rows.map(([s, label]) => {
              const v = answer(s);
              return (
                <li key={s} className="border-b border-stone-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => (s === "size" ? onClose() : goTo(steps.indexOf(s)))}
                    className="group flex w-full items-center gap-2.5 py-3.5 pr-3 pl-4 text-left transition-colors duration-150 hover:bg-orange-50/60"
                  >
                    <span className="text-[15px] text-stone-500">{label}</span>
                    <span className={`ml-auto text-right text-[15px] ${v ? "font-medium text-stone-900" : "text-stone-400"}`}>{v || (s === "size" ? "Pick on the page" : "Skipped")}</span>
                    <ChevronIcon size={16} className="shrink-0 text-stone-400 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </button>
                </li>
              );
            })}
          </ul>
          <Kept desktop={desktop} />
        </>
      );
    }
    const m = measure(step);
    const isHeight = step === "height";
    const usual = isHeight ? HEIGHT.min : m!.min;
    const max = isHeight ? HEIGHT.max : m!.max;
    return (
      <>
        <Ruler key={step + answers.unit} label={`${title(step)} in centimetres`} value={cm} min={0} max={max} onChange={setCm} jumpTo={jump} />
        <Entry key={step} cm={cm} unit={answers.unit} height={isHeight} max={max} label={title(step)} onEnter={(v) => setJump((j) => ({ value: v, id: (j?.id ?? 0) + 1 }))} />
        <p className={`-mt-2 min-h-[38px] text-center text-[13px] leading-[1.45] text-balance ${cm > 0 && cm < usual ? "text-amber-800" : "text-stone-500"}`} aria-live="polite">
          {cm === 0 ? "Drag the tape or tap the number to type it. Leave it at 0 to skip." : cm < usual ? "That’s smaller than most. Measure again to be sure." : ""}
        </p>
        {unitSwitch}
        {isHeight ? (
          <div className="flex flex-col items-center">
            {!why ? (
              <button type="button" onClick={() => setWhy(true)} className={`${smallLink} min-h-11`}>
                <QuestionIcon /> Why Mimi asks
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", duration: 0.35, bounce: 0 }} className="flex w-full flex-col gap-1.5 rounded-[14px] border border-stone-200 bg-white px-4 py-3.5">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[15px] font-semibold">Why Mimi asks</span>
                  <button type="button" onClick={() => setWhy(false)} className={smallLink}>
                    Hide
                  </button>
                </span>
                <span className="text-[14px] leading-[1.45] text-stone-600">Every piece is crocheted for the person who wears it. Your height tells Mimi where a hem or a sleeve should land on you.</span>
                <span className="text-[13px] leading-[1.45] text-stone-500">Your answers stay {desktop ? "in this browser" : "on this phone"}. Mimi only sees them with your order.</span>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="flex gap-2.5 rounded-[14px] bg-amber-100 px-3.5 py-3 text-[13px] leading-[1.45] text-amber-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-px shrink-0" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Mimi makes your piece to these numbers. If they’re wrong, it can’t be remade for free.
          </div>
        )}
      </>
    );
  };

  const footer = (
    <div className="flex items-center gap-4">
      <button type="button" className={`${linkClass} px-3`} onClick={back}>
        Back
      </button>
      {step === "check" ? (
        <Button className="flex-1" onClick={onSave}>
          Save my fit
        </Button>
      ) : (
        <Button className="flex-1" onClick={next}>
          Next: {steps[i + 1] === "check" ? "Check" : title(steps[i + 1])}
        </Button>
      )}
    </div>
  );

  // Desktop: the answers fill in beside the question.
  const beside = (
    <div className="flex flex-1 flex-col gap-4 px-6 pt-7 pb-6">
      <div className="flex flex-col gap-1">
        <span className="font-serif text-[22px] leading-tight">Your fit</span>
        <span className="text-[13px] text-stone-500">Fills in as you answer. Tap a line to go back to it.</span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {(["size", ...steps] as (FitStep | "size")[]).map((s) => {
          const v = s === "check" ? "" : answer(s);
          const current = s === step;
          const state = current ? "now" : v ? "done" : skipped.includes(s as FitStep) ? "skipped" : "todo";
          const label = s === "size" ? "Size" : s === "check" ? "Check" : title(s);
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => (s === "size" ? onClose() : goTo(steps.indexOf(s as FitStep)))}
                className={`flex w-full items-center gap-2.5 rounded-[14px] px-2.5 py-2.5 text-left text-[15px] transition-colors duration-150 ${current ? "bg-orange-50" : "hover:bg-stone-50"}`}
              >
                <StateMark state={state} />
                <span className={current ? "font-semibold" : state === "todo" ? "text-stone-400" : ""}>{label}</span>
                <span className={`ml-auto text-right ${v ? "text-stone-600" : "text-stone-400"}`}>{v || (state === "skipped" ? "Skipped" : "")}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto">
        <Kept desktop />
      </div>
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} side="center" title={title(step)} aside={`${i + 1} of ${steps.length}`} top={bars} beside={beside} footer={footer}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10, transition: { duration: 0.12 } }}
          transition={{ type: "spring", duration: 0.32, bounce: 0 }}
          className="flex flex-col gap-[18px]"
        >
          <p className="text-[15px] leading-[1.5] text-stone-600">{help(step)}</p>
          {body()}
        </motion.div>
      </AnimatePresence>
    </Sheet>
  );
}

/**
 * The big number. Tap it to type a number instead of dragging the tape (the tape then rolls to it).
 * 0 is shown faded: nothing measured yet.
 */
function Entry({ cm, unit, height, max, label, onEnter }: { cm: number; unit: "cm" | "in"; height: boolean; max: number; label: string; onEnter: (cm: number) => void }) {
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const cancel = useRef(false);
  const feetInches = height && unit === "in";
  const unitWord = unit === "cm" ? "cm" : feetInches ? "ft in" : "in";
  const start = () => {
    cancel.current = false;
    setText(cm === 0 ? "" : feetInches ? heightLabel(cm, "in").replace(" ft ", " ").replace(" in", "") : String(unit === "cm" ? cm : toIn(cm)));
    setTyping(true);
  };
  const done = () => {
    setTyping(false);
    if (cancel.current) return;
    const v = parseEntry(text, unit, height);
    if (v !== null) onEnter(Math.min(max, Math.max(0, v)));
  };
  if (typing)
    return (
      <p className="flex h-[72px] items-center justify-center gap-1.5">
        <input
          autoFocus
          inputMode="decimal"
          enterKeyHint="done"
          aria-label={`${label} in ${unit === "cm" ? "centimetres" : feetInches ? "feet and inches, like 5 7" : "inches"}`}
          value={text}
          placeholder={feetInches ? "5 7" : "0"}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setText(e.target.value)}
          onBlur={done}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              // cancel the typing only, not the whole sheet (it closes on Escape too)
              e.stopPropagation();
              cancel.current = true;
              e.currentTarget.blur();
            }
          }}
          className="w-[3.4ch] border-b-2 border-stone-900 bg-transparent text-center font-serif text-[64px] leading-none outline-none placeholder:text-stone-300"
        />
        <span className="text-[18px] font-medium text-stone-500">{unitWord}</span>
      </p>
    );
  const empty = cm === 0;
  return (
    <button
      type="button"
      onClick={start}
      className="group mx-auto flex h-[72px] items-center justify-center gap-1.5 rounded-[14px] px-4 transition-colors duration-150 hover:bg-orange-100/60"
      aria-label={`${label}: ${empty ? "not measured" : feetInches ? heightLabel(cm, "in") : `${unit === "cm" ? cm : toIn(cm)} ${unit}`}. Tap to type it`}
    >
      {feetInches && !empty ? (
        <span className="font-serif text-[56px] leading-none">{heightLabel(cm, "in").replace(" ft ", "′ ").replace(" in", "″")}</span>
      ) : (
        <span className={empty ? "text-stone-300" : ""}>
          <CountingNumber value={unit === "cm" ? cm : toIn(cm)} countOn={unit} className="font-serif text-[64px] leading-none" />
        </span>
      )}
      {!(feetInches && !empty) && <span className="text-[18px] font-medium text-stone-500">{unit}</span>}
    </button>
  );
}

/** A typed number in the unit on screen, as centimetres. Feet and inches: "5 7", "5'7", "5" (feet) or "67" (inches). Empty is 0. */
function parseEntry(text: string, unit: "cm" | "in", height: boolean): number | null {
  const nums = (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => parseFloat(n.replace(",", ".")));
  if (!nums.length) return text.trim() === "" ? 0 : null;
  if (unit === "cm") return Math.round(nums[0]);
  if (height) {
    const [a, b] = nums;
    const inches = b !== undefined ? a * 12 + b : a <= 8 ? a * 12 : a;
    return Math.round(inches * 2.54);
  }
  return Math.round(nums[0] * 2.54);
}

function Kept({ desktop }: { desktop: boolean }) {
  return (
    <p className="flex gap-2 text-[13px] leading-[1.45] text-stone-500">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
        {desktop ? (
          <path d="M4 5h16v11H4zM2 20h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="6" y="2.5" width="12" height="19" rx="2.5" stroke="currentColor" strokeWidth="2" />
            <path d="M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
      </svg>
      {desktop ? "Kept in this browser" : "Kept on this phone"}, so your next order starts with it. Mimi gets it with this order.
    </p>
  );
}

function StateMark({ state }: { state: "done" | "now" | "skipped" | "todo" }) {
  if (state === "done")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" aria-hidden>
        <circle cx="12" cy="12" r="10" className="fill-emerald-600" />
        <path d="m7.5 12.5 3 3 6-6.5" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (state === "now")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" aria-hidden>
        <circle cx="12" cy="12" r="9" fill="none" className="stroke-amber-600" strokeWidth="2.2" />
        <circle cx="12" cy="12" r="3.5" className="fill-amber-600" />
      </svg>
    );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" className="stroke-stone-300" strokeWidth="1.8" strokeDasharray={state === "skipped" ? "3 3" : undefined} />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.3 2.37c-.48.17-.8.6-.8 1.1V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
