"use client";

import { useRef } from "react";
import { hsvToHex } from "@/lib/colour-match";

// "Or pick any shade": a shade square (left to right: soft to strong, top to bottom: light to dark)
// and a hue strip under it, like a design tool's colour picker. Drag either; arrow keys work too.

export type Shade = { h: number; s: number; v: number };

function useDrag(onMove: (x: number, y: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const at = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    onMove(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  };
  return {
    ref,
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      at(e);
    },
    onPointerMove: (e: React.PointerEvent) => e.currentTarget.hasPointerCapture(e.pointerId) && at(e),
  };
}

export function ShadePicker({ value, onChange }: { value: Shade; onChange: (s: Shade) => void }) {
  const square = useDrag((x, y) => onChange({ ...value, s: x, v: 1 - y }));
  const strip = useDrag((x) => onChange({ ...value, h: x * 360 }));
  const hex = hsvToHex(value.h, value.s, value.v);
  const pure = hsvToHex(value.h, 1, 1);
  const thumb = "pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white shadow-[0_0_0_1px_rgb(28_25_23/0.25),0_2px_8px_rgb(28_25_23/0.35)]";

  return (
    <div className="flex flex-col gap-3">
      <div
        {...square}
        role="slider"
        tabIndex={0}
        aria-label="Shade: light to dark, soft to strong"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value.v * 100)}
        aria-valuetext={`${Math.round(value.s * 100)}% strength, ${Math.round(value.v * 100)}% brightness`}
        onKeyDown={(e) => {
          const d = { ArrowLeft: [-0.05, 0], ArrowRight: [0.05, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] }[e.key];
          if (!d) return;
          e.preventDefault();
          onChange({ ...value, s: Math.min(1, Math.max(0, value.s + d[0])), v: Math.min(1, Math.max(0, value.v + d[1])) });
        }}
        className="relative h-36 cursor-crosshair touch-none rounded-[14px]"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pure})` }}
      >
        <span className={thumb} style={{ left: `${value.s * 100}%`, top: `${(1 - value.v) * 100}%`, background: hex }} />
      </div>
      <div
        {...strip}
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(value.h)}
        onKeyDown={(e) => {
          const d = { ArrowLeft: -6, ArrowRight: 6, ArrowUp: 6, ArrowDown: -6 }[e.key];
          if (!d) return;
          e.preventDefault();
          onChange({ ...value, h: (value.h + d + 360) % 360 });
        }}
        className="relative h-4 cursor-pointer touch-none rounded-full"
        style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
      >
        <span className={thumb} style={{ left: `${(value.h / 360) * 100}%`, top: "50%", background: pure }} />
      </div>
    </div>
  );
}
