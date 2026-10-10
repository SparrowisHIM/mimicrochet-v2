"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform, useVelocity, type AnimationPlaybackControls } from "motion/react";
import { useCallback, useEffect, useEffectEvent, useRef } from "react";
import { primeTick, tick } from "@/lib/tick-sound";

// A measuring tape you drag, flick, scroll or step with the arrow keys. It follows the SparrowisHIM
// "measuring-component" tape, made calmer for a shop: the tape trails the finger through a stiff,
// light spring; at speed the ticks lean into the direction of travel; a flick keeps it spooling and
// it lands on a whole number; past either end it stretches like rubber and wobbles back. The ticks
// are drawn on a canvas, so nothing re-renders while it moves. Each step gives a soft tick sound (a
// little firmer every 5) and, on phones, a tiny haptic tick.

const GAP = 13.5; // px per step
const GIVE = 2.5; // steps of rubbery give past either end
const TICK = "#a8a29e"; // stone-400

export function Ruler({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  jumpTo,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  /** A number typed in elsewhere: each new id rolls the tape to it (it reports the numbers on the way). */
  jumpTo?: { value: number; id: number };
}) {
  const reduce = Boolean(useReducedMotion());
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const motionRef = useRef<AnimationPlaybackControls | null>(null);
  const last = useRef(value);

  // raw: where the finger (or a fling) puts the tape. shown: what's drawn, a spring behind it.
  const raw = useMotionValue(value);
  const shown = useSpring(raw, reduce ? { stiffness: 2000, damping: 120 } : { stiffness: 340, damping: 36, mass: 0.55 });
  const speed = useVelocity(shown);
  const leanTarget = useTransform(() => (reduce ? 0 : Math.max(-2.5, Math.min(2.5, speed.get() * 0.045))));
  const lean = useSpring(leanTarget, { stiffness: 320, damping: 30 });
  // The needle gives a small click as each number passes at speed.
  const click = useMotionValue(0);
  const needleScale = useTransform(click, (c) => 1 + c * 0.07);

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);
  const snap = useCallback((v: number) => clamp(Math.round(v / step) * step), [clamp, step]);
  const rubber = (v: number) =>
    v < min ? min - GIVE * step * Math.tanh((min - v) / (GIVE * step)) : v > max ? max + GIVE * step * Math.tanh((v - max) / (GIVE * step)) : v;

  const settle = (to: number, spring = { stiffness: 420, damping: 40 }) => {
    motionRef.current?.stop();
    if (reduce) {
      raw.set(to);
      return;
    }
    motionRef.current = animate(raw, to, { type: "spring", ...spring });
  };

  /* ------------------------------- drawing ------------------------------- */

  const draw = useCallback(() => {
    const el = canvas.current;
    const g = el?.getContext("2d");
    if (!el || !g) return;
    const dpr = window.devicePixelRatio || 1;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const at = shown.get() / step;
    const half = Math.ceil(w / GAP / 2) + 1;
    g.fillStyle = TICK;
    for (let i = Math.floor(at - half); i <= Math.ceil(at + half); i++) {
      const v = i * step;
      if (v < min || v > max) continue;
      const d = Math.abs(i - at);
      if (d < 0.5) continue; // the needle stands here
      const major = Math.round(v / step) % 5 === 0;
      const th = Math.max(16, 64 - d * 4.2);
      g.globalAlpha = Math.max(0.1, (major ? 0.95 : 0.8) - d * 0.075);
      const x = w / 2 + (i - at) * GAP;
      g.beginPath();
      if (g.roundRect) g.roundRect(x - 1.5, h / 2 - th / 2, 3, th, 1.5);
      else g.rect(x - 1.5, h / 2 - th / 2, 3, th);
      g.fill();
    }
    g.globalAlpha = 1;
  }, [shown, step, min, max]);

  useMotionValueEvent(shown, "change", (v) => {
    draw();
    const next = snap(v);
    if (next === last.current) return;
    last.current = next;
    if (Math.abs(speed.get()) > 18 && !reduce) {
      click.jump(1);
      animate(click, 0, { duration: 0.16, ease: "easeOut" });
    }
    if ("vibrate" in navigator) navigator.vibrate?.(4);
    tick(Math.round(next / step) % 5 === 0 ? 1.5 : 1);
    onChange(next);
  });

  // A typed number rolls the tape to it. Kept apart from `value`, which follows the tape's own reports:
  // comparing against it races the roll (a late report looks like a new number and stops it halfway).
  const jumped = useRef(jumpTo?.id);
  const roll = useEffectEvent((to: number) => settle(clamp(to)));
  useEffect(() => {
    if (!jumpTo || jumpTo.id === jumped.current) return;
    jumped.current = jumpTo.id;
    roll(jumpTo.value);
  }, [jumpTo]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    draw();
    const ro = new ResizeObserver(() => draw());
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  /* ------------------------------- dragging ------------------------------- */

  // trail keeps ~100ms of positions, so a flick's speed comes from the finger's last motion.
  const drag = useRef<{ x: number; start: number; trail: { v: number; t: number }[] } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    primeTick();
    motionRef.current?.stop();
    e.currentTarget.setPointerCapture(e.pointerId);
    const start = raw.get();
    drag.current = { x: e.clientX, start, trail: [{ v: start, t: e.timeStamp }] };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const v = d.start + ((d.x - e.clientX) / GAP) * step;
    d.trail.push({ v, t: e.timeStamp });
    while (d.trail.length > 2 && e.timeStamp - d.trail[0].t > 100) d.trail.shift();
    raw.set(rubber(v));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const fresh = d.trail.filter((s) => e.timeStamp - s.t <= 120);
    const dt = fresh.length ? (e.timeStamp - fresh[0].t) / 1000 : 0;
    const now = d.start + ((d.x - e.clientX) / GAP) * step;
    const velocity = dt > 0.008 ? (now - fresh[0].v) / dt : 0; // steps per second
    const at = raw.get();
    if (at < min || at > max) return settle(clamp(at), { stiffness: 320, damping: 24 }); // rubber snaps back, a small wobble
    // A steady drag lands where it is; only a real flick (about 340px a second or more) keeps going.
    if (Math.abs(velocity) < 25 || reduce) return settle(snap(at));
    // A flick keeps spooling: friction bleeds the speed off and it lands on a whole number; the ends catch it.
    const power = 0.22;
    motionRef.current?.stop();
    motionRef.current = animate(raw, at + power * velocity, {
      type: "inertia",
      velocity,
      power,
      timeConstant: 280,
      min,
      max,
      bounceStiffness: 320,
      bounceDamping: 26,
      restDelta: 0.01,
      modifyTarget: snap,
    });
  };

  /* --------------------------- wheel and keys --------------------------- */

  // A trackpad or wheel scrolls the tape (not the sheet behind it), then it settles on a number.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let idle: ReturnType<typeof setTimeout>;
    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      e.preventDefault();
      motionRef.current?.stop();
      raw.set(clamp(raw.get() + (d / GAP) * step * 0.6));
      clearTimeout(idle);
      idle = setTimeout(() => {
        motionRef.current = animate(raw, snap(raw.get()), { type: "spring", stiffness: 420, damping: 40 });
      }, 140);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      clearTimeout(idle);
    };
  }, [raw, clamp, snap, step]);

  const onKey = (e: React.KeyboardEvent) => {
    primeTick();
    const big = e.shiftKey ? 5 : 1;
    const to =
      e.key === "ArrowRight" || e.key === "ArrowUp" ? value + step * big : e.key === "ArrowLeft" || e.key === "ArrowDown" ? value - step * big : e.key === "Home" ? min : e.key === "End" ? max : null;
    if (to === null) return;
    e.preventDefault();
    settle(snap(to));
  };

  return (
    <div
      ref={box}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKey}
      className="relative h-[92px] w-full cursor-grab touch-none overflow-hidden rounded-[14px] select-none active:cursor-grabbing"
      style={{ maskImage: "linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)" }}
    >
      <motion.canvas ref={canvas} className="absolute inset-0 size-full" style={{ skewX: lean }} aria-hidden />
      <motion.span className="absolute top-1/2 left-1/2 h-[84px] w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-900" style={{ scaleY: needleScale }} aria-hidden />
    </div>
  );
}
