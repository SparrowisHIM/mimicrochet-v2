"use client";

import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react";
import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cleanName, formatPhone, isNigerianMobile, phoneDigits, phoneProblem } from "@/lib/validate";

export const inputClass =
  "h-[52px] w-full rounded-[14px] border border-stone-300 bg-white px-4 text-[16px] outline-none transition-[border-color,box-shadow] placeholder:text-stone-400 focus:border-stone-900 focus:shadow-[0_0_0_3px_rgb(28_25_23/0.08)] aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:shadow-[0_0_0_3px_rgb(220_38_38/0.12)]";

export function Check({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Label, hint, the control, then one message line: an error, or a short "letters only" style nudge. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  nudge,
  shake = 0,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  nudge?: string | null;
  /** Bump this number to shake the field (e.g. each failed send). */
  shake?: number;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const msgId = useId();
  const message = error ?? nudge;
  const controls = useAnimationControls();
  const hasError = Boolean(error);
  useEffect(() => {
    if (shake && hasError && !reduce) controls.start({ x: [0, -7, 7, -5, 5, -2, 0], transition: { duration: 0.38 } });
  }, [shake, hasError, reduce, controls]);
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{label}</span>
        {hint && <span className="text-[14px] text-stone-500">{hint}</span>}
      </label>
      <motion.div animate={controls} aria-describedby={message ? msgId : undefined}>
        {Children.map(children, (child) => isValidElement<{ "aria-describedby"?: string }>(child)
          ? cloneElement(child, { "aria-describedby": [child.props["aria-describedby"], message ? msgId : null].filter(Boolean).join(" ") || undefined })
          : child)}
      </motion.div>
      <AnimatePresence initial={false}>
        {message && (
          <motion.p
            id={msgId}
            key={message}
            role={error ? "alert" : "status"}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`flex items-center gap-1.5 overflow-hidden text-[13px] font-medium ${error ? "text-red-700" : "text-amber-800"}`}
          >
            <span className={`grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${error ? "bg-red-600" : "bg-amber-600"}`} aria-hidden>
              !
            </span>
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Show a short nudge for a moment (e.g. when a typed character was refused). */
export function useNudge(ms = 1800) {
  const [nudge, setNudge] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const flash = (text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setNudge(text);
    timer.current = setTimeout(() => setNudge(null), ms);
  };
  return [nudge, flash] as const;
}

/** Name: letters only. Digits and symbols are refused as they're typed. */
export function NameInput({
  "aria-describedby": describedBy,
  id,
  value,
  onChange,
  invalid,
  onBlur,
  onNudge,
}: {
  "aria-describedby"?: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  onBlur?: () => void;
  onNudge: (text: string) => void;
}) {
  return (
    <input
      id={id}
      aria-describedby={describedBy}
      autoComplete="name"
      autoCapitalize="words"
      value={value}
      onBlur={onBlur}
      onChange={(e) => {
        const raw = e.target.value;
        const clean = cleanName(raw);
        if (clean.length < raw.replace(/\s{2,}/g, " ").length) onNudge("Names use letters only.");
        onChange(clean);
      }}
      className={inputClass}
      aria-invalid={invalid}
    />
  );
}

/** Typed phone, formatted as you go: "0801 234 5678" or "801 234 5678". Only digits get in. */
export function formatTyped(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("234")) d = d.slice(3);
  if (d.startsWith("0")) {
    d = d.slice(0, 11);
    return [d.slice(0, 4), d.slice(4, 7), d.slice(7, 11)].filter(Boolean).join(" ");
  }
  return formatPhone(d.slice(0, 10));
}

export function PhoneInput({
  "aria-describedby": describedBy,
  id,
  value,
  onChange,
  invalid,
  onBlur,
  onNudge,
}: {
  "aria-describedby"?: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  onBlur?: () => void;
  onNudge: (text: string) => void;
}) {
  const digits = phoneDigits(value);
  const ok = isNigerianMobile(digits) && !phoneProblem(value);
  const typed = value.replace(/\D/g, "");
  return (
    <div
      className={`flex h-[52px] w-full items-center rounded-[14px] border bg-white transition-[border-color,box-shadow] focus-within:shadow-[0_0_0_3px_rgb(28_25_23/0.08)] ${
        invalid ? "border-red-500" : "border-stone-300 focus-within:border-stone-900"
      }`}
    >
      <span className="flex h-full shrink-0 items-center gap-2 border-r border-stone-200 pr-3 pl-4 text-[16px] font-medium text-stone-700">
        <span className="flex h-3.5 w-5 overflow-hidden rounded-[3px] ring-1 ring-stone-200" aria-hidden>
          <span className="flex-1 bg-emerald-700" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-emerald-700" />
        </span>
        +234
      </span>
      <input
        id={id}
        aria-describedby={describedBy}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="801 234 5678"
        value={value}
        onBlur={onBlur}
        onChange={(e) => {
          const raw = e.target.value;
          if (/[^\d\s+()-]/.test(raw)) {
            onNudge("Numbers only, like 0801 234 5678.");
            return;
          }
          const compact = raw.replace(/[\s()-]/g, "");
          // A foreign code stays as typed, so the field can say it isn't a Nigerian number.
          if (compact.startsWith("+") && !compact.startsWith("+234") && !"+234".startsWith(compact)) {
            onChange(raw);
            return;
          }
          // Digits past a full number never go in: 11 with a leading 0, otherwise 10 after +234.
          const next = formatTyped(raw);
          const country = /^\+?234/.test(compact) ? 3 : 0;
          if (raw.replace(/\D/g, "").length > next.replace(/\D/g, "").length + country) onNudge("That’s the full number: 11 digits, starting with 0.");
          onChange(next);
        }}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-[16px] tracking-[0.02em] outline-none placeholder:text-stone-400"
        aria-invalid={invalid}
      />
      <span className="flex w-12 shrink-0 justify-center pr-3" aria-hidden>
        <AnimatePresence mode="popLayout" initial={false}>
          {ok ? (
            <motion.span
              key="ok"
              className="grid size-6 place-items-center rounded-full bg-emerald-600 text-white"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 520, damping: 20 }}
            >
              <Check size={12} />
            </motion.span>
          ) : digits.length > 0 ? (
            <motion.span key="count" className="text-[12px] font-semibold text-stone-400 tabular-nums" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {typed.length}/{typed.startsWith("0") ? 11 : 10}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>
    </div>
  );
}

export { phoneProblem };
