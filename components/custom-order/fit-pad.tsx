"use client";

import { animate, motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useReducedMotion, type MotionValue, type ValueAnimationTransition } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { fitWords, type Fit } from "@/lib/fit";
import { lengthAt, outlines, widthAt, type FitKind } from "@/lib/fit-outline";
import { primeTick, tick } from "@/lib/tick-sound";

// "How it fits", drawn as a crocheter's blocking mat: a fine dotted surface with five fit lines each
// way, and a heavy magnetic pin that sits where two lines cross (25 places). Tight to loose runs
// across, short to long runs down, in plain words with arrows; the middle is the piece like the
// picture. The words the pin is heading toward light up.
//
// The pin feels held to the mat: it follows the finger through a stiff spring (weight, never lag),
// near a crossing it's pulled in like a magnet, each crossing it passes gives a small tick and a buzz
// on phones, past the outer lines it gives like rubber, and let go it drops onto the nearest crossing
// with a little bounce. The dots and lines around it warm up as it moves. Arrow keys move it hole by hole.

const N = 5;
const pos = (i: number) => `${((i + 0.5) / N) * 100}%`;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const follow: ValueAnimationTransition = { type: "spring", stiffness: 900, damping: 50, mass: 0.6 };
const drop: ValueAnimationTransition = { type: "spring", stiffness: 520, damping: 19, mass: 0.9 };
const now: ValueAnimationTransition = { duration: 0 };

/** `live`: where the pin is right now, in mat units (-2 to 2, in between included), for the picture under the mat. */
export function FitPad({ value, onChange, live }: { value: Fit; onChange: (f: Fit) => void; live?: { x: MotionValue<number>; y: MotionValue<number> } }) {
  const reduce = Boolean(useReducedMotion());
  const mat = useRef<HTMLDivElement>(null);
  const size = useRef({ w: 0, h: 0 });
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const press = useMotionValue(1);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(false);
  const hole = useRef(value);

  // The warm patch of dots and the glowing lines follow the pin.
  const near = useMotionTemplate`radial-gradient(circle 96px at ${x}px ${y}px, #000 0%, rgb(0 0 0 / 0.55) 42%, transparent 100%)`;
  const lines = useMotionTemplate`radial-gradient(circle 190px at ${x}px ${y}px, #000 0%, transparent 100%)`;

  useMotionValueEvent(x, "change", (v) => size.current.w && live?.x.set((v / size.current.w) * N - 0.5 - 2));
  useMotionValueEvent(y, "change", (v) => size.current.h && live?.y.set((v / size.current.h) * N - 0.5 - 2));

  const centre = (f: Fit) => ({ x: ((f.x + 2 + 0.5) / N) * size.current.w, y: ((f.y + 2 + 0.5) / N) * size.current.h });

  // Keep the pin on its hole when the mat is drawn, resized, or the answer changes from outside.
  useEffect(() => {
    const el = mat.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      size.current = { w: e.contentRect.width, h: e.contentRect.height };
      if (dragRef.current) return;
      const c = centre(hole.current);
      x.jump(c.x);
      y.jump(c.y);
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (dragRef.current || (value.x === hole.current.x && value.y === hole.current.y)) return;
    hole.current = value;
    const c = centre(value);
    animate(x, c.x, reduce ? now : drop);
    animate(y, c.y, reduce ? now : drop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.x, value.y]);

  const feel = (strength = 1) => {
    tick(strength);
    if ("vibrate" in navigator) navigator.vibrate?.(strength > 1 ? 9 : 4);
  };

  /** Where the pin goes for a finger at (px, py): pulled toward the nearest hole, rubbery past the outer ones. */
  const place = (px: number, py: number) => {
    const { w, h } = size.current;
    const give = 18;
    const band = (v: number, lo: number, hi: number) => (v < lo ? lo - give * Math.tanh((lo - v) / give) : v > hi ? hi + give * Math.tanh((v - hi) / give) : v);
    const fx = band(px, w * 0.1, w * 0.9);
    const fy = band(py, h * 0.1, h * 0.9);
    const col = clamp(Math.round((fx / w) * N - 0.5), 0, N - 1);
    const row = clamp(Math.round((fy / h) * N - 0.5), 0, N - 1);
    const cx = ((col + 0.5) / N) * w;
    const cy = ((row + 0.5) / N) * h;
    const reach = (Math.min(w, h) / N) * 0.46;
    const d = Math.hypot(fx - cx, fy - cy);
    const pull = d < reach ? (1 - d / reach) ** 2 * 0.9 : 0;
    return { px: fx + (cx - fx) * pull, py: fy + (cy - fy) * pull, fit: { x: col - 2, y: row - 2 } };
  };

  const move = (e: PointerEvent) => {
    const r = mat.current!.getBoundingClientRect();
    const p = place(e.clientX - r.left, e.clientY - r.top);
    animate(x, p.px, reduce ? now : follow);
    animate(y, p.py, reduce ? now : follow);
    if (p.fit.x !== hole.current.x || p.fit.y !== hole.current.y) {
      hole.current = p.fit;
      feel();
      onChange(p.fit);
    }
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    primeTick();
    dragRef.current = true;
    setDragging(true);
    // Picked up: the pin lifts a little off the mat.
    animate(press, reduce ? 1 : 1.07, { type: "spring", stiffness: 420, damping: 24 });
    move(e);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) move(e);
  };
  const onUp = () => {
    if (!dragRef.current) return;
    dragRef.current = false;
    setDragging(false);
    const c = centre(hole.current);
    // It drops into the hole: a little bounce, and the pin settles with a click.
    animate(x, c.x, reduce ? now : drop);
    animate(y, c.y, reduce ? now : drop);
    if (!reduce) animate(press, 0.93, { duration: 0.09, ease: "easeOut" }).then(() => animate(press, 1, { type: "spring", stiffness: 600, damping: 14 }));
    feel(1.6);
    onChange(hole.current);
  };

  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!step) return;
    e.preventDefault();
    primeTick();
    const next = { x: clamp(hole.current.x + step[0], -2, 2), y: clamp(hole.current.y + step[1], -2, 2) };
    if (next.x === hole.current.x && next.y === hole.current.y) return;
    hole.current = next;
    const c = centre(next);
    animate(x, c.x, reduce ? now : drop);
    animate(y, c.y, reduce ? now : drop);
    feel();
    onChange(next);
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
    <Way label="Short" dir="up" on={value.y < 0} />
    <div
      ref={mat}
      className={`relative h-[264px] w-full touch-none overflow-hidden rounded-[22px] border border-stone-200 bg-white shadow-[inset_0_2px_10px_rgb(28_25_23/0.07)] select-none lg:h-[300px] ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* the mat's fine texture, and the same dots warming up around the pin */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,var(--color-stone-300)_0.8px,transparent_1.2px)] bg-size-[8px_8px] bg-position-[2px_2px] opacity-60" aria-hidden />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle,var(--color-amber-600)_1px,transparent_1.5px)] bg-size-[8px_8px] bg-position-[2px_2px]"
        style={{ maskImage: near, WebkitMaskImage: near, opacity: dragging ? 0.95 : 0.7 }}
        aria-hidden
      />
      {Array.from({ length: N }, (_, i) => (
        <span key={i} aria-hidden>
          <span className="absolute inset-y-0 w-px bg-stone-200" style={{ left: pos(i) }} />
          <span className="absolute inset-x-0 h-px bg-stone-200" style={{ top: pos(i) }} />
        </span>
      ))}
      {/* the lines through the pin glow, fading away from it */}
      <motion.div className="absolute inset-0" style={{ maskImage: lines, WebkitMaskImage: lines }} aria-hidden>
        <motion.span className="absolute inset-y-0 left-0 w-[1.5px] -translate-x-1/2 bg-amber-600/75" style={{ x }} />
        <motion.span className="absolute inset-x-0 top-0 h-[1.5px] -translate-y-1/2 bg-amber-600/75" style={{ y }} />
      </motion.div>
      <span className="absolute -translate-x-1/2 translate-y-3 text-[11px] font-medium text-stone-400" style={{ left: pos(2), top: pos(2) }} aria-hidden>
        Like the picture
      </span>
      {/* Tight and Loose sit between two rows of crossings, so the pin never rests on them */}
      <Way label="Tight" dir="left" on={value.x < 0} className="absolute top-[40%] left-2.5 -translate-y-1/2" />
      <Way label="Loose" dir="right" on={value.x > 0} className="absolute top-[40%] right-2.5 -translate-y-1/2" />
      {/* the pin's magnetic field */}
      <motion.span
        className="absolute top-0 left-0 size-[120px] -translate-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-amber-400)_34%,transparent),transparent_70%)]"
        style={{ x, y }}
        animate={{ scale: dragging ? 1.25 : 1, opacity: dragging ? 1 : 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        aria-hidden
      />
      {/* the pin: a heavy glossy head with a warm stud; it lifts while held and clicks down when dropped */}
      <motion.button
        type="button"
        className="absolute top-0 left-0 grid size-12 -translate-1/2 cursor-grab place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--color-stone-600),var(--color-stone-800)_55%,var(--color-stone-950))] ring-[2.5px] ring-white transition-shadow duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600 active:cursor-grabbing"
        style={{
          x,
          y,
          scale: press,
          boxShadow: dragging
            ? "0 18px 26px -8px rgb(28 25 23 / 0.42), 0 0 22px color-mix(in oklab, var(--color-amber-500) 35%, transparent)"
            : "0 10px 16px -6px rgb(28 25 23 / 0.38), 0 0 16px color-mix(in oklab, var(--color-amber-500) 22%, transparent)",
        }}
        onKeyDown={onKey}
        aria-label={`How it fits: ${fitWords(value)}. Use the arrow keys to move the pin.`}
      >
        <span className="absolute top-[7px] left-[10px] h-[11px] w-5 rounded-full bg-linear-to-b from-white/45 to-white/0" aria-hidden />
        <span className="size-2.5 rounded-full bg-[radial-gradient(circle,var(--color-amber-300),var(--color-amber-600))]" aria-hidden />
      </motion.button>
    </div>
    <Way label="Long" dir="down" on={value.y > 0} />
    </div>
  );
}

const arrows = { left: "M19 12H5M11 6l-6 6 6 6", right: "M5 12h14M13 6l6 6-6 6", up: "M12 19V5M6 11l6-6 6 6", down: "M12 5v14M6 13l6 6 6-6" };

/** One of the four directions, as a plain word with an arrow; it lights up when the pin heads that way. */
function Way({ label, dir, on, className = "" }: { label: string; dir: keyof typeof arrows; on: boolean; className?: string }) {
  const icon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={arrows[dir]} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <span className={`pointer-events-none flex items-center gap-1 text-[14px] font-semibold whitespace-nowrap transition-colors duration-200 ${on ? "text-amber-700" : "text-stone-700"} ${className}`} aria-hidden>
      {dir === "right" || dir === "down" ? (
        <>
          {label}
          {icon}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </span>
  );
}

/**
 * The little drawing of their piece under the mat. It's redrawn from the pin's position every time the
 * pin moves: wider or narrower across, longer or shorter down. The dashed line is the piece like the picture.
 */
export function FitPicture({ kind, x, y }: { kind: FitKind; x: MotionValue<number>; y: MotionValue<number> }) {
  const body = useRef<SVGPathElement>(null);
  const detail = useRef<SVGPathElement>(null);
  const draw = () => {
    const o = outlines[kind](widthAt(x.get()), lengthAt(y.get()));
    body.current?.setAttribute("d", o.body);
    detail.current?.setAttribute("d", o.detail);
  };
  useMotionValueEvent(x, "change", draw);
  useMotionValueEvent(y, "change", draw);
  const now = outlines[kind](widthAt(x.get()), lengthAt(y.get()));
  const ghost = outlines[kind](1, 1);
  return (
    <span className="grid h-[124px] w-24 shrink-0 place-items-center rounded-[18px] border border-stone-200 bg-white" aria-hidden>
      <svg viewBox="0 0 100 130" className="h-[116px] w-[89px]">
        <path d={ghost.body} fill="none" className="stroke-stone-300" strokeWidth={1.3} strokeDasharray="3 3" strokeLinejoin="round" />
        <path ref={body} d={now.body} className="fill-white stroke-stone-900" strokeWidth={2} strokeLinejoin="round" />
        <path ref={detail} d={now.detail} fill="none" className="stroke-stone-900" strokeWidth={1.2} strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** A small, still copy of the mat for summaries, with the pin where the customer left it. */
export function MiniMat({ fit }: { fit?: Fit }) {
  const f = fit ?? { x: 0, y: 0 };
  return (
    <span className="relative size-[52px] shrink-0 overflow-hidden rounded-[12px] border border-stone-200 bg-white" aria-hidden>
      <span className="absolute inset-0 bg-[radial-gradient(circle,var(--color-stone-300)_0.5px,transparent_0.9px)] bg-size-[5px_5px] opacity-70" />
      {/* inset a little, so a pin on an outer hole isn't cut by the edge */}
      <span className="absolute inset-[5px]">
        {Array.from({ length: N }, (_, i) => (
          <span key={i}>
            <span className="absolute -inset-y-[5px] w-px bg-stone-200" style={{ left: pos(i) }} />
            <span className="absolute -inset-x-[5px] h-px bg-stone-200" style={{ top: pos(i) }} />
          </span>
        ))}
        <span className="absolute size-7 -translate-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-amber-400)_38%,transparent),transparent_70%)]" style={{ left: pos(f.x + 2), top: pos(f.y + 2) }} />
        <span
          className="absolute grid size-[14px] -translate-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--color-stone-600),var(--color-stone-950))] ring-[1.5px] ring-white"
          style={{ left: pos(f.x + 2), top: pos(f.y + 2) }}
        >
          <span className="size-1 rounded-full bg-amber-500" />
        </span>
      </span>
    </span>
  );
}
