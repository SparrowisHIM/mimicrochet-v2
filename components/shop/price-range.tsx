"use client";

import { useRef } from "react";
import { formatNaira } from "@/lib/site";

// A price range with two handles (like v1's), and small bars above it showing how many pieces sit
// at each price, lit inside the chosen range, so you can see where the pieces are as you drag.

const BINS = 18;

export function PriceRange({
  domain,
  step = 1000,
  value,
  prices,
  onChange,
}: {
  domain: [number, number];
  step?: number;
  value: [number, number];
  prices: number[];
  onChange: (v: [number, number]) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [lo, hi] = domain;
  const span = hi - lo || 1;
  const pct = (n: number) => ((n - lo) / span) * 100;
  const snap = (n: number) => Math.min(hi, Math.max(lo, Math.round(n / step) * step));
  const fromX = (x: number) => {
    const r = track.current!.getBoundingClientRect();
    return snap(lo + ((x - r.left) / r.width) * span);
  };
  const set = (thumb: 0 | 1, n: number) => onChange(thumb === 0 ? [Math.min(n, value[1]), value[1]] : [value[0], Math.max(n, value[0])]);

  const counts = Array.from({ length: BINS }, () => 0);
  for (const p of prices) counts[Math.min(BINS - 1, Math.floor(((p - lo) / span) * BINS))]++;
  const most = Math.max(...counts, 1);

  const handle = (thumb: 0 | 1) => {
    const n = value[thumb];
    return (
      <div
        role="slider"
        tabIndex={0}
        aria-label={thumb === 0 ? "Lowest price" : "Highest price"}
        aria-valuemin={thumb === 0 ? lo : value[0]}
        aria-valuemax={thumb === 0 ? value[1] : hi}
        aria-valuenow={n}
        aria-valuetext={formatNaira(n)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && set(thumb, fromX(e.clientX))}
        onKeyDown={(e) => {
          const d = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: step * 10, PageDown: -step * 10 }[e.key];
          if (e.key === "Home" || e.key === "End") {
            e.preventDefault();
            set(thumb, e.key === "Home" ? lo : hi);
          } else if (d) {
            e.preventDefault();
            set(thumb, snap(n + d));
          }
        }}
        className="absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-[2.5px] border-white bg-stone-900 shadow-[0_2px_8px_rgb(28_25_23/0.35)] transition-transform duration-150 hover:scale-110 active:scale-110 active:cursor-grabbing"
        style={{ left: `${pct(n)}%`, zIndex: thumb === 0 && value[0] > hi - step * 2 ? 2 : 1 }}
      />
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-[15px] font-semibold tabular-nums">
        <span>{formatNaira(value[0])}</span>
        <span className="text-[13px] font-normal text-stone-500">to</span>
        <span>{formatNaira(value[1])}</span>
      </div>
      <div className="flex h-10 items-end gap-[3px] px-3.5" aria-hidden>
        {counts.map((c, i) => {
          const mid = lo + ((i + 0.5) / BINS) * span;
          const inside = mid >= value[0] && mid <= value[1];
          return <span key={i} className={`flex-1 rounded-t-[3px] transition-colors duration-200 ${inside ? "bg-stone-900" : "bg-stone-300"}`} style={{ height: c ? `${18 + (c / most) * 82}%` : "6%" }} />;
        })}
      </div>
      <div ref={track} className="relative mx-3.5 h-1.5 rounded-full bg-stone-200">
        <span className="absolute inset-y-0 rounded-full bg-stone-900" style={{ left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }} aria-hidden />
        {handle(0)}
        {handle(1)}
      </div>
    </div>
  );
}
