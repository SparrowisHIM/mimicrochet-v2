"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { Check } from "@/components/form/fields";
import { areaAliases, isNigerianState, lgasByState, nigerianStates, popularStates, stateCapitals, type NigerianState } from "@/lib/nigeria";

// A command-palette style picker (search, quick chips, a keyboard-friendly list, key hints),
// after the "Type command or search" palette in the sage references. Places can only be
// picked from the list, so an order can never say "Berlin".

type Option = { value: string; detail?: string; matched?: string };
type Section = { label: string; items: Option[] };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-amber-200/70 text-stone-900">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="grid h-5 min-w-5 place-items-center rounded-[5px] border border-stone-200 bg-stone-50 px-1 font-sans text-[11px] font-semibold text-stone-500">{children}</kbd>;
}

function Combobox({
  id,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  sections,
  chips,
  empty,
  disabled,
  disabledText,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  sections: (query: string) => Section[];
  chips?: string[];
  empty: (query: string) => React.ReactNode;
  disabled?: boolean;
  disabledText?: string;
  invalid?: boolean;
}) {
  const reduce = useReducedMotion();
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const list = open ? sections(query) : [];
  const flat = list.flatMap((s) => s.items);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const show = () => {
    if (disabled) return;
    setQuery("");
    setActive(0);
    setOpen(true);
    // On phones, lift the field so the list has room above the keyboard.
    if (window.matchMedia("(max-width: 1023px)").matches) trigger.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };
  const pick = (v: string) => {
    onChange(v);
    close();
  };
  const move = (to: number) => {
    const n = (to + flat.length) % Math.max(flat.length, 1);
    setActive(n);
    document.getElementById(`${listId}-${n}`)?.scrollIntoView({ block: "nearest" });
  };

  let index = -1;
  return (
    <div ref={wrap} className="relative">
      <button
        ref={trigger}
        id={id}
        type="button"
        onClick={() => (open ? close(false) : show())}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-invalid={invalid || undefined}
        aria-disabled={disabled}
        className={`flex h-[52px] w-full scroll-mt-28 items-center justify-between gap-3 rounded-[14px] border bg-white px-4 text-left text-[16px] transition-[border-color,box-shadow] outline-none focus-visible:border-stone-900 focus-visible:shadow-[0_0_0_3px_rgb(28_25_23/0.08)] ${
          invalid ? "border-red-500" : open ? "border-stone-900 shadow-[0_0_0_3px_rgb(28_25_23/0.08)]" : "border-stone-300 hover:border-stone-500"
        } ${disabled ? "cursor-not-allowed bg-stone-50" : ""}`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value || "empty"}
            className={`truncate ${value ? "font-medium text-stone-900" : "text-stone-400"}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {value || (disabled ? disabledText : placeholder)}
          </motion.span>
        </AnimatePresence>
        <motion.svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-stone-500" animate={{ rotate: open ? 180 : 0 }} aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute inset-x-0 top-full z-40 mt-2 flex origin-top flex-col overflow-hidden rounded-[18px] border border-stone-200 bg-white shadow-[0_28px_70px_-24px_rgb(28_25_23/0.35)]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
          >
            <div className="flex items-center gap-2.5 border-b border-stone-100 px-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-stone-500" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                autoFocus
                role="combobox"
                aria-expanded
                aria-controls={listId}
                aria-activedescendant={flat.length ? `${listId}-${active}` : undefined}
                aria-autocomplete="list"
                aria-label={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Tab") return close(false);
                  if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;
                  e.preventDefault();
                  if (e.key === "ArrowDown") move(active + 1);
                  else if (e.key === "ArrowUp") move(active - 1);
                  else if (e.key === "Escape") close();
                  else if (flat[active]) pick(flat[active].value);
                }}
                placeholder={searchPlaceholder}
                className="h-[52px] w-full bg-transparent text-[16px] outline-none placeholder:text-stone-400"
              />
            </div>

            {chips && !query && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-stone-100 px-3 py-2.5">
                {chips.map((c, i) => (
                  <motion.button
                    key={c}
                    type="button"
                    onClick={() => pick(c)}
                    whileTap={{ scale: 0.94 }}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i, duration: 0.25 }}
                    className={`h-9 shrink-0 rounded-full border px-3.5 text-[14px] font-medium transition-colors ${
                      c === value ? "border-stone-900 bg-stone-900 text-orange-50" : "border-stone-200 hover:border-stone-900"
                    }`}
                  >
                    {c}
                  </motion.button>
                ))}
              </div>
            )}

            <ul id={listId} role="listbox" className="max-h-[min(300px,42svh)] overflow-y-auto overscroll-contain p-1.5">
              {flat.length === 0 ? (
                <li className="px-3 py-6 text-center text-[14px] leading-[1.5] text-stone-500">{empty(query)}</li>
              ) : (
                list.map((s) => (
                  <li key={s.label} role="presentation">
                    <span className="block px-2.5 pt-2.5 pb-1.5 text-[12px] font-medium text-stone-400">{s.label}</span>
                    <ul role="presentation">
                      {s.items.map((o) => {
                        index += 1;
                        const i = index;
                        const on = o.value === value;
                        return (
                          <motion.li
                            key={`${s.label}-${o.value}`}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={on}
                            onPointerMove={() => i !== active && setActive(i)}
                            onClick={() => pick(o.value)}
                            initial={reduce || i > 10 ? false : { opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.015 * i, duration: 0.2 }}
                            className={`flex cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[15px] ${i === active ? "bg-stone-100" : ""}`}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              <span className="font-medium text-stone-900">
                                <Highlight text={o.value} query={query} />
                              </span>
                              {(o.matched || o.detail) && (
                                <span className="pl-2 text-[13px] text-stone-500">
                                  {o.matched ? (
                                    <>
                                      includes <Highlight text={o.matched} query={query} />
                                    </>
                                  ) : (
                                    o.detail
                                  )}
                                </span>
                              )}
                            </span>
                            {on && (
                              <motion.span className="grid size-5 place-items-center rounded-full bg-stone-900 text-white" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <Check />
                              </motion.span>
                            )}
                          </motion.li>
                        );
                      })}
                    </ul>
                  </li>
                ))
              )}
            </ul>

            <div className="hidden items-center gap-4 border-t border-stone-100 bg-stone-50/60 px-4 py-2.5 text-[12px] font-medium text-stone-500 lg:flex">
              <span className="flex items-center gap-1.5">Navigate <Kbd>↑</Kbd><Kbd>↓</Kbd></span>
              <span className="flex items-center gap-1.5">Select <Kbd>↵</Kbd></span>
              <span className="ml-auto flex items-center gap-1.5">Close <Kbd>esc</Kbd></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------- state ----------------------------- */

function stateSections(query: string): Section[] {
  const q = norm(query);
  if (!q) return [{ label: "All 36 states and the FCT", items: nigerianStates.map((s) => ({ value: s, detail: stateCapitals[s] })) }];
  const items: Option[] = [];
  for (const s of nigerianStates) {
    if (norm(s).includes(q) || norm(s.replace("FCT ", "")).includes(q)) items.push({ value: s, detail: stateCapitals[s] });
    else if (norm(stateCapitals[s]).includes(q)) items.push({ value: s, matched: stateCapitals[s] });
    else {
      // Typing a town or local government still finds its state: "Lekki" → Lagos.
      const lga = lgasByState[s].find((l) => norm(l).includes(q));
      const alias = Object.values(areaAliases[s] ?? {}).flat().find((a) => norm(a).includes(q));
      if (alias || lga) items.push({ value: s, matched: alias ?? lga });
    }
  }
  return items.length ? [{ label: "States", items }] : [];
}

export function StatePicker({ id, value, onChange, invalid }: { id: string; value: string; onChange: (v: NigerianState) => void; invalid?: boolean }) {
  return (
    <Combobox
      id={id}
      value={value}
      onChange={(v) => isNigerianState(v) && onChange(v)}
      placeholder="Choose your state"
      searchPlaceholder="Search a state or city"
      sections={stateSections}
      chips={popularStates}
      invalid={invalid}
      empty={(q) => (
        <>
          No Nigerian state matches “{q}”.
          <br />
          Mimi delivers anywhere in Nigeria, so pick a state from the list.
        </>
      )}
    />
  );
}

/* ----------------------------- area (local government) ----------------------------- */

function areaSections(state: string, query: string): Section[] {
  if (!isNigerianState(state)) return [];
  const aliases = areaAliases[state] ?? {};
  const all = lgasByState[state].map((l) => ({ value: l, detail: aliases[l]?.join(", ") }));
  const q = norm(query);
  if (!q) {
    const known = all.filter((o) => o.detail);
    return [...(known.length ? [{ label: "Popular areas", items: known }] : []), { label: `All ${all.length} in ${state}`, items: all }];
  }
  const items = all.flatMap((o) => {
    if (norm(o.value).includes(q)) return [o];
    const hit = aliases[o.value]?.find((a) => norm(a).includes(q));
    return hit ? [{ ...o, matched: hit }] : [];
  });
  return items.length ? [{ label: "Local governments", items }] : [];
}

export function AreaPicker({ id, state, value, onChange, invalid }: { id: string; state: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  return (
    <Combobox
      id={id}
      value={value}
      onChange={onChange}
      placeholder="Choose your area"
      searchPlaceholder="Search your area or town"
      disabled={!isNigerianState(state)}
      disabledText="Choose your state first"
      sections={(q) => areaSections(state, q)}
      invalid={invalid}
      empty={(q) => (
        <>
          Nothing in {state} matches “{q}”.
          <br />
          Try the local government your area is in.
        </>
      )}
    />
  );
}
