"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronIcon } from "@/components/icons";

// A small menu for picking one option (the shop's Sort), in place of the browser's native dropdown:
// the trigger says what's chosen and shows it opens, the list grows from the trigger's corner, the
// current choice has a tick, and arrows, Enter, Escape and Tab work like a native select.

type Option<T extends string> = { key: T; label: string };

export function SelectMenu<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}) {
  const reduce = useReducedMotion();
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const current = options.find((o) => o.key === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const away = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const show = () => {
    setActive(Math.max(0, options.findIndex((o) => o.key === value)));
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };
  const pick = (o: Option<T>) => {
    onChange(o.key);
    close();
  };

  return (
    <div ref={wrap} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          }
        }}
        className={`group inline-flex h-11 items-center gap-1.5 rounded-full px-3.5 text-[15px] transition-colors duration-200 hover:bg-stone-900/[0.06] ${open ? "bg-stone-900/[0.06]" : ""}`}
      >
        <span className="text-stone-500">{label}</span>
        <span className="font-medium text-stone-900">{current.label}</span>
        <motion.span className="grid text-stone-500 transition-colors duration-200 group-hover:text-stone-900" animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", duration: 0.3, bounce: 0 }}>
          <ChevronIcon size={16} direction="down" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={`${id}-${active}`}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
              } else if (e.key === "Home" || e.key === "End") {
                e.preventDefault();
                setActive(e.key === "Home" ? 0 : options.length - 1);
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pick(options[active]);
              } else if (e.key === "Escape") {
                e.preventDefault();
                close();
              } else if (e.key === "Tab") close(false);
            }}
            className="absolute top-full right-0 z-40 mt-2 flex min-w-[232px] origin-top-right flex-col rounded-[18px] border border-stone-200 bg-white p-1.5 shadow-[0_24px_60px_-20px_rgb(28_25_23/0.35)] outline-none"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
            transition={{ type: "spring", duration: 0.28, bounce: 0 }}
          >
            {options.map((o, i) => {
              const on = o.key === value;
              return (
                <li
                  key={o.key}
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={on}
                  onPointerMove={() => i !== active && setActive(i)}
                  onClick={() => pick(o)}
                  className={`flex h-11 items-center justify-between gap-6 rounded-[12px] px-3 text-[15px] transition-colors duration-100 ${i === active ? "bg-stone-100" : ""} ${on ? "text-stone-900" : "text-stone-600"}`}
                >
                  {o.label}
                  <span className={`grid size-5 place-items-center rounded-full transition-opacity duration-150 ${on ? "bg-stone-900 text-orange-50 opacity-100" : "opacity-0"}`} aria-hidden>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.2 5 8.6 9.6 3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
