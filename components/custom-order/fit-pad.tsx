"use client";

import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, type ValueAnimationTransition } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { fitWords, type Fit } from "@/lib/fit";
import { primeTick, tick } from "@/lib/tick-sound";

// "How it fits", drawn as a crocheter's blocking mat: a fine dotted surface with measuring ticks on
// two edges and five fit lines each way. Where the lines cross are 25 pin holes, and a heavy magnetic
// pin sits in one of them. Snug to relaxed runs across, shorter to longer runs down; the middle hole
// is the piece as it's pictured.
//
// The pin feels held to the mat: it follows the finger through a stiff spring (weight, never lag),
// near a hole it's pulled in like a magnet, each hole it passes gives a small tick and a buzz on
// phones, past the outer holes it gives like rubber, and let go it drops into the nearest hole with a
// little bounce. The dots and lines around it warm up as it moves. Arrow keys move it hole by hole.

const N = 5;
const pos = (i: number) => `${((i + 0.5) / N) * 100}%`;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const follow: ValueAnimationTransition = { type: "spring", stiffness: 900, damping: 50, mass: 0.6 };
const drop: ValueAnimationTransition = { type: "spring", stiffness: 520, damping: 19, mass: 0.9 };
const now: ValueAnimationTransition = { duration: 0 };

export function FitPad({ value, onChange }: { value: Fit; onChange: (f: Fit) => void }) {
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
    <div
      ref={mat}
      className={`relative h-[300px] w-full touch-none overflow-hidden rounded-[22px] border border-stone-200 bg-white shadow-[inset_0_2px_10px_rgb(28_25_23/0.07)] select-none lg:h-[330px] ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
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
      {/* measuring ticks along the top and left edges, longer at each fit line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(90deg,var(--color-stone-400)_0_1px,transparent_1px_8px)] opacity-60" aria-hidden />
      <div className="absolute inset-y-0 left-0 w-1 bg-[repeating-linear-gradient(180deg,var(--color-stone-400)_0_1px,transparent_1px_8px)] opacity-60" aria-hidden />
      {Array.from({ length: N }, (_, i) => (
        <span key={i} aria-hidden>
          <span className="absolute top-0 h-[9px] w-px bg-stone-400/70" style={{ left: pos(i) }} />
          <span className="absolute left-0 h-px w-[9px] bg-stone-400/70" style={{ top: pos(i) }} />
          <span className="absolute inset-y-0 w-px bg-stone-200" style={{ left: pos(i) }} />
          <span className="absolute inset-x-0 h-px bg-stone-200" style={{ top: pos(i) }} />
        </span>
      ))}
      {/* the lines through the pin glow, fading away from it */}
      <motion.div className="absolute inset-0" style={{ maskImage: lines, WebkitMaskImage: lines }} aria-hidden>
        <motion.span className="absolute inset-y-0 left-0 w-[1.5px] -translate-x-1/2 bg-amber-600/75" style={{ x }} />
        <motion.span className="absolute inset-x-0 top-0 h-[1.5px] -translate-y-1/2 bg-amber-600/75" style={{ y }} />
      </motion.div>
      {/* pin holes; the middle one is the piece as pictured */}
      {Array.from({ length: N * N }, (_, k) => {
        const i = k % N;
        const j = Math.floor(k / N);
        const mid = i === 2 && j === 2;
        return (
          <span
            key={k}
            className={`absolute -translate-1/2 rounded-full ${mid ? "size-3.5 border-[1.5px] border-amber-600 bg-orange-50" : "size-[7px] border border-stone-300 bg-white"}`}
            style={{ left: pos(i), top: pos(j) }}
            aria-hidden
          />
        );
      })}
      <span className="absolute -translate-x-1/2 translate-y-3 text-[11px] font-medium text-stone-400" style={{ left: pos(2), top: pos(2) }} aria-hidden>
        As pictured
      </span>
      {/* edge tags */}
      {[
        ["Shorter", "left-1/2 top-1 -translate-x-1/2"],
        ["Longer", "left-1/2 bottom-1 -translate-x-1/2"],
        ["Snug", "left-[5%] top-1/2 -translate-1/2 -rotate-90"],
        ["Relaxed", "left-[95%] top-1/2 -translate-1/2 rotate-90"],
      ].map(([t, at]) => (
        <span key={t} className={`absolute rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap text-stone-600 ${at}`} aria-hidden>
          {t}
        </span>
      ))}
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
