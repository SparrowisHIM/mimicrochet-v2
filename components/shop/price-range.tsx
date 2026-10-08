"use client";

import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatNaira } from "@/lib/site";

// Price: one field that holds the whole range, after the "Opacity" slider reference. The grey band is
// the chosen range and the dark bars at its ends are the handles. Drag anywhere on the field and the
// nearer end follows your finger 1:1, then springs onto the nearest ₦1,000 when you let go. Tap a price
// to type it. Pulling past either end stretches the field a little and it springs back. A handle
// passing over a price fades so the price stays readable. The bars above rise from the cheapest end
// to the dearest and light up inside the range. The top end is open: ₦100,000+ means no upper limit.

const BARS = 24;
/** The band never gets narrower than this, so both handles stay grabbable. */
const GAP = 46;
/** How far each handle sits inside the band's edge. */
const INSET = 11;
const SPRING = { type: "spring", stiffness: 520, damping: 42 } as const;
/** Pulling past an end stretches the field, harder the further you pull, up to 16px. */
const rubber = (px: number) => 16 * Math.tanh(px / 50);

type End = 0 | 1;
type Drag = { id: number; x0: number; which: End | null; offset: number; label: End | null };

export function PriceRange({
  domain,
  step = 1000,
  value,
  onChange,
}: {
  domain: [number, number];
  step?: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const reduce = useReducedMotion();
  const [lo, hi] = domain;
  const span = hi - lo || 1;
  const frac = (n: number) => (n - lo) / span;
  const snap = (n: number) => Math.min(hi, Math.max(lo, Math.round(n / step) * step));
  const text = (n: number) => (n >= hi ? `${formatNaira(hi)}+` : formatNaira(n));

  const field = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLElement | null)[]>([null, null]);
  const [width, setWidth] = useState(320);
  const [dragging, setDragging] = useState<End | null>(null);
  const [editing, setEditing] = useState<End | null>(null);
  const [draft, setDraft] = useState("");

  // Where each end sits (0 to 1). They follow the finger exactly while dragging, and spring to the
  // value otherwise (keys, taps, typing, letting go).
  const a = useMotionValue(frac(value[0]));
  const b = useMotionValue(frac(value[1]));
  const pullL = useMotionValue(0);
  const pullR = useMotionValue(0);
  const drag = useRef<Drag | null>(null);
  const live = useRef(value);
  const room = useRef(Math.max(1, width - GAP));
  useLayoutEffect(() => {
    live.current = value;
    room.current = Math.max(1, width - GAP);
  });

  useLayoutEffect(() => {
    const el = field.current!;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Values that change from outside (Clear all, typing, keys, a tap) glide there; the dragged end stays put.
  useEffect(() => {
    const glide = (mv: MotionValue<number>, to: number) => {
      if (Math.abs(mv.get() - to) < 1e-4) return;
      if (reduce) mv.jump(to);
      else animate(mv, to, SPRING);
    };
    if (drag.current?.which !== 0) glide(a, (value[0] - lo) / span);
    if (drag.current?.which !== 1) glide(b, (value[1] - lo) / span);
  }, [value, lo, span, reduce, a, b]);

  const handleX = (which: End) => (which === 0 ? a.get() * room.current + INSET : b.get() * room.current + GAP - INSET);

  // The band: from a to b, never narrower than GAP, plus any stretch past the ends.
  const bInv = useTransform(b, (v) => 1 - v);
  const bandLeft = useMotionTemplate`calc((100% - ${GAP}px) * ${a} - ${pullL}px)`;
  const bandRight = useMotionTemplate`calc((100% - ${GAP}px) * ${bInv} - ${pullR}px)`;
  const fieldLeft = useTransform(pullL, (p) => -p);
  const fieldRight = useTransform(pullR, (p) => -p);

  // A handle crossing a price fades to a ghost so the number stays readable.
  const over = (x: number) =>
    labels.current.some((l) => {
      const f = field.current;
      if (!l || !f) return false;
      const r = l.getBoundingClientRect();
      const left = f.getBoundingClientRect().left;
      return x > r.left - left - 3 && x < r.right - left + 3;
    });
  const fadeA = useTransform(() => (over(a.get() * room.current + INSET - pullL.get()) ? 0.18 : 1));
  const fadeB = useTransform(() => (over(b.get() * room.current + GAP - INSET + pullR.get()) ? 0.18 : 1));

  const emit = (which: End, n: number) => {
    const [x, y] = live.current;
    const next: [number, number] = which === 0 ? [Math.min(n, y), y] : [x, Math.max(n, x)];
    if (next[0] !== x || next[1] !== y) {
      live.current = next;
      onChange(next);
    }
  };

  // Follow the finger: the end's position comes straight from the pointer, clamped to the other end.
  const track = (d: Drag, clientX: number) => {
    const w = room.current;
    const local = clientX - field.current!.getBoundingClientRect().left - d.offset;
    if (d.which === 0) {
      const f = (local - INSET) / w;
      pullL.set(f < 0 ? rubber(-f * w) : 0);
      const v = Math.min(Math.max(f, 0), b.get());
      a.set(v);
      emit(0, snap(lo + v * span));
    } else {
      const f = (local + INSET - GAP) / w;
      pullR.set(f > 1 ? rubber((f - 1) * w) : 0);
      const v = Math.max(Math.min(f, 1), a.get());
      b.set(v);
      emit(1, snap(lo + v * span));
    }
  };

  /** Let go: the end springs onto its ₦1,000 step and any stretch springs back. */
  const settle = (which: End) => {
    const mv = which === 0 ? a : b;
    const to = frac(live.current[which]);
    if (reduce) mv.jump(to);
    else animate(mv, to, { ...SPRING, velocity: mv.getVelocity() });
    for (const p of [pullL, pullR]) if (p.get()) animate(p, 0, reduce ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 26 });
  };

  /** The end nearer the pointer; when the two meet, the direction of the drag decides. */
  const nearest = (x: number, dir = 0): End => {
    const d0 = Math.abs(x - handleX(0));
    const d1 = Math.abs(x - handleX(1));
    if (Math.abs(d0 - d1) < 6 && dir) return dir > 0 ? 1 : 0;
    return d0 <= d1 ? 0 : 1;
  };

  const startEdit = (which: End) => {
    setDraft(String(live.current[which]));
    setEditing(which);
  };
  const commit = () => {
    if (editing === null) return;
    const n = Number(draft);
    if (draft && Number.isFinite(n)) emit(editing, snap(n));
    setEditing(null);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editing !== null || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const label = (e.target as HTMLElement).closest("[data-end]")?.getAttribute("data-end");
    drag.current = { id: e.pointerId, x0: e.clientX, which: null, offset: 0, label: label === "0" ? 0 : label === "1" ? 1 : null };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (d.which === null) {
      if (Math.abs(e.clientX - d.x0) < 4) return;
      const x = d.x0 - field.current!.getBoundingClientRect().left;
      d.which = nearest(x, e.clientX - d.x0);
      // Grabbed the handle itself: keep the grip where it was. Anywhere else: the end comes to the finger.
      const off = x - handleX(d.which);
      d.offset = Math.abs(off) <= 22 ? off : 0;
      setDragging(d.which);
    }
    track(d, e.clientX);
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setDragging(null);
    if (d.which !== null) return settle(d.which);
    if (cancelled) return;
    // A tap: on a price, type it; anywhere else, the nearer end glides there.
    if (d.label !== null) return startEdit(d.label);
    const x = e.clientX - field.current!.getBoundingClientRect().left;
    const which = nearest(x);
    const f = which === 0 ? (x - INSET) / room.current : (x + INSET - GAP) / room.current;
    emit(which, snap(lo + Math.min(1, Math.max(0, f)) * span));
  };

  const onKey = (which: End) => (e: React.KeyboardEvent) => {
    const n = live.current[which];
    const by = e.shiftKey ? step * 10 : step;
    const moves: Record<string, number> = { ArrowRight: n + by, ArrowUp: n + by, ArrowLeft: n - by, ArrowDown: n - by, PageUp: n + step * 10, PageDown: n - step * 10, Home: lo, End: hi };
    if (!(e.key in moves)) return;
    e.preventDefault();
    emit(which, snap(moves[e.key]));
  };

  const fa = frac(value[0]);
  const fb = frac(value[1]);
  const w = Math.max(1, width - GAP);
  const lit = (i: number) => {
    const c = ((i + 0.5) / BARS) * width;
    return c >= fa * w - 1 && c <= fb * w + GAP + 1;
  };

  const handle = (which: End) => (
    <motion.div
      role="slider"
      tabIndex={0}
      aria-label={which === 0 ? "Lowest price" : "Highest price"}
      aria-valuemin={which === 0 ? lo : value[0]}
      aria-valuemax={which === 0 ? value[1] : hi}
      aria-valuenow={value[which]}
      aria-valuetext={text(value[which])}
      onKeyDown={onKey(which)}
      className={`absolute inset-y-0 z-10 grid w-6 place-items-center rounded-md ${which === 0 ? "-left-px" : "-right-px"} ${dragging === which ? "cursor-grabbing" : "cursor-grab"}`}
      style={{ opacity: which === 0 ? fadeA : fadeB }}
    >
      <span className={`h-[18px] w-[3px] rounded-full bg-stone-900 transition-transform duration-150 ${dragging === which ? "scale-y-125" : ""}`} />
    </motion.div>
  );

  const label = (which: End) => (
    <span
      data-end={which}
      className={`pointer-events-auto relative z-20 flex h-full items-center ${which === 0 ? "pl-[22px]" : "pr-[22px]"}`}
    >
      {editing === which ? (
        <span ref={(el) => void (labels.current[which] = el)} className="-mx-1.5 flex items-center rounded-[8px] bg-white px-1.5 py-0.5 text-[15px] font-semibold tabular-nums shadow-[0_0_0_1px_var(--color-stone-400),0_2px_6px_-2px_rgb(28_25_23/0.25)]">
          ₦
          <input
            autoFocus
            inputMode="numeric"
            aria-label={which === 0 ? "Type the lowest price" : "Type the highest price"}
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 7))}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                e.stopPropagation();
                setEditing(null);
              }
            }}
            className="min-w-[2ch] bg-transparent tabular-nums outline-none [field-sizing:content] selection:bg-stone-300"
          />
        </span>
      ) : (
        <button
          ref={(el) => void (labels.current[which] = el)}
          type="button"
          // Pointer taps are handled by the field (so a drag that starts on a price still drags); this is for keys.
          onClick={(e) => e.detail === 0 && startEdit(which)}
          aria-label={`${which === 0 ? "Lowest" : "Highest"} price ${text(value[which])}. Press Enter to type a price.`}
          className="cursor-text rounded-[4px] text-[15px] font-semibold tabular-nums"
        >
          {text(value[which])}
        </button>
      )}
    </span>
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex h-10 items-end gap-[3px]" aria-hidden>
        {Array.from({ length: BARS }, (_, i) => (
          <span
            key={i}
            className={`flex-1 rounded-t-[3px] transition-colors duration-200 ${lit(i) ? "bg-stone-900" : "bg-stone-300"}`}
            style={{ height: `${14 + 86 * ((i + 1) / BARS) ** 1.3}%` }}
          />
        ))}
      </div>
      <div
        ref={field}
        role="group"
        aria-label="Price range"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => onPointerEnd(e)}
        onPointerCancel={(e) => onPointerEnd(e, true)}
        className={`relative h-12 touch-pan-y select-none ${dragging === null ? "cursor-pointer" : "cursor-grabbing"}`}
      >
        <motion.div className="absolute inset-y-0 rounded-[14px] border border-stone-300 bg-white" style={{ left: fieldLeft, right: fieldRight }} aria-hidden />
        <motion.div className="absolute inset-y-[3px] rounded-[11px] bg-stone-200" style={{ left: bandLeft, right: bandRight }}>
          {handle(0)}
          {handle(1)}
        </motion.div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between">
          {label(0)}
          {label(1)}
        </div>
      </div>
    </div>
  );
}
