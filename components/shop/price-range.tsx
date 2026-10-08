"use client";

import { useRef } from "react";
import { formatNaira } from "@/lib/site";

// A price range with two handles (like v1's), with bars above it that rise from the cheapest end to
// the dearest, lit inside the chosen range. The top end reads ₦100,000+: no upper limit.

const BARS = 18;

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

  const label = (n: number) => (n >= hi ? `${formatNaira(hi)}+` : formatNaira(n));

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
        aria-valuetext={label(n)}
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
        <span>{label(value[0])}</span>
        <span className="text-[13px] font-normal text-stone-500">to</span>
        <span>{label(value[1])}</span>
      </div>
      <div className="flex h-10 items-end gap-[3px] px-3.5" aria-hidden>
        {Array.from({ length: BARS }, (_, i) => {
          const mid = lo + ((i + 0.5) / BARS) * span;
          const inside = mid >= value[0] && mid <= value[1];
          return <span key={i} className={`flex-1 rounded-t-[3px] transition-colors duration-200 ${inside ? "bg-stone-900" : "bg-stone-300"}`} style={{ height: `${14 + 86 * ((i + 1) / BARS) ** 1.3}%` }} />;
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
