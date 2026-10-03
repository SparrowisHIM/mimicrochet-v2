"use client";

import { useEffect, useRef, useState } from "react";

const GAP = 13.5; // px per step

/**
 * Drag (or scroll, or use arrow keys) to pick a value. Ticks fade and shrink away from the
 * centre like a bell curve; phones get a tiny haptic tick per step.
 */
export function Ruler({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
}) {
  const [drag, setDrag] = useState<{ x: number; v: number } | null>(null);
  const [offset, setOffset] = useState(0); // sub-step offset while dragging, for smooth motion
  const last = useRef(value);
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(353);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const set = (v: number) => {
    const next = clamp(v);
    if (next !== last.current) {
      last.current = next;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(4);
      onChange(next);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ x: e.clientX, v: value });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const steps = (drag.x - e.clientX) / GAP;
    const raw = drag.v + steps * step;
    set(raw);
    setOffset(raw - clamp(raw));
  };
  const end = () => {
    setDrag(null);
    setOffset(0);
  };

  const onWheel = (e: React.WheelEvent) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) > 2) set(value + Math.sign(d) * step);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const big = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); set(value + step * big); }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); set(value - step * big); }
    if (e.key === "Home") set(min);
    if (e.key === "End") set(max);
  };

  const half = Math.ceil(width / GAP / 2) + 1;
  const ticks = [];
  for (let i = -half; i <= half; i++) {
    const v = value + i * step;
    if (v < min || v > max) continue;
    const d = Math.abs(i - offset / step);
    const isMid = i === 0 && Math.abs(offset) < step / 2;
    const h = isMid ? 84 : Math.max(16, 64 - d * 4.2);
    const major = Math.round(v / step) % 5 === 0;
    ticks.push(
      <span
        key={v}
        className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${isMid ? "w-1 bg-stone-900" : "w-[3px] bg-stone-400"}`}
        style={{
          left: width / 2 + (i - offset / step) * GAP,
          height: h,
          opacity: isMid ? 1 : Math.max(0.1, (major ? 0.95 : 0.8) - d * 0.075),
          transition: drag ? "none" : "left 0.18s ease-out, height 0.18s ease-out",
        }}
      />,
    );
  }

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
      onPointerUp={end}
      onPointerCancel={end}
      onWheel={onWheel}
      onKeyDown={onKey}
      className="relative h-[92px] w-full cursor-grab touch-none overflow-hidden rounded-[14px] select-none active:cursor-grabbing"
      style={{ maskImage: "linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)" }}
    >
      {ticks}
    </div>
  );
}
