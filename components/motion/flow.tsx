"use client";

import { useMotionValue, useMotionValueEvent, type MotionValue } from "motion/react";
import { useEffect, useId, useRef } from "react";

// A short run of amber that travels along a path, like water through a channel: a bright head and a
// tail that fades out behind it. `head` is how far along the path the front is, in px; it can sit
// before the start or past the end, so the run can flow in and drain out. Each frame the visible part
// of the run is traced from the path and shaded with one gradient from its back to its front, so the
// fade is smooth round corners too. Nothing re-renders as it moves.

const STEP = 4; // px between traced points
const fade = (x: number) => Math.max(0, Math.min(1, x)) ** 1.6;

/** `tail` can move too: a tail that stretches with speed reads like water running faster. */
export function Flow({ d, head, tail: tailIn, width }: { d: string; head: MotionValue<number>; tail: number | MotionValue<number>; width: number }) {
  // useId can contain characters that break url(#…) references.
  const id = `flow${useId().replace(/[^\w-]/g, "")}`;
  const track = useRef<SVGPathElement>(null);
  const run = useRef<SVGPathElement>(null);
  const grad = useRef<SVGLinearGradientElement>(null);
  const stops = useRef<(SVGStopElement | null)[]>([]);
  const dot = useRef<SVGGElement>(null);

  const still = useMotionValue(0);
  const tailMv = typeof tailIn === "number" ? still : tailIn;

  const draw = (h: number) => {
    const tail = typeof tailIn === "number" ? tailIn : tailIn.get();
    const p = track.current;
    const r = run.current;
    const g = grad.current;
    const o = dot.current;
    if (!p || !r || !g || !o) return;
    const total = p.getTotalLength();
    const a = Math.max(0, h - tail);
    const b = Math.min(total, h);
    o.style.opacity = h >= 0 && h <= total ? "1" : "0";
    if (b - a < 0.5) {
      r.setAttribute("d", "");
      return;
    }
    const n = Math.max(2, Math.ceil((b - a) / STEP));
    let line = "";
    for (let i = 0; i <= n; i++) {
      const pt = p.getPointAtLength(a + ((b - a) * i) / n);
      line += `${i ? "L" : "M"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }
    r.setAttribute("d", line);
    const from = p.getPointAtLength(a);
    const to = p.getPointAtLength(b);
    g.setAttribute("x1", String(from.x));
    g.setAttribute("y1", String(from.y));
    // A run that has curled back on itself still needs a direction to fade along.
    const far = Math.hypot(to.x - from.x, to.y - from.y) > 1;
    g.setAttribute("x2", String(far ? to.x : from.x + 1));
    g.setAttribute("y2", String(far ? to.y : from.y));
    // How bright the back and the front of the visible run are: clipped runs (flowing in, draining out) start or end part-way up the fade.
    const back = (a - (h - tail)) / tail;
    const front = (b - (h - tail)) / tail;
    [0, 0.5, 1].forEach((t, i) => stops.current[i]?.setAttribute("stop-opacity", String(fade(back + (front - back) * t))));
    if (h >= 0 && h <= total) {
      const pt = p.getPointAtLength(h);
      o.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
    }
  };
  useMotionValueEvent(head, "change", draw);
  useMotionValueEvent(tailMv, "change", () => draw(head.get()));
  // The path changes when the layout does; redraw the run on it.
  useEffect(() => draw(head.get()));

  return (
    <g>
      <defs>
        <linearGradient ref={grad} id={`${id}-run`} gradientUnits="userSpaceOnUse">
          {[0, 0.5, 1].map((t, i) => (
            <stop
              key={t}
              ref={(el) => {
                stops.current[i] = el;
              }}
              offset={t}
              stopColor="currentColor"
              className="text-amber-600"
            />
          ))}
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="currentColor" stopOpacity="0.55" className="text-amber-400" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" className="text-amber-400" />
        </radialGradient>
      </defs>
      <path ref={track} d={d} fill="none" stroke="none" />
      <path ref={run} fill="none" stroke={`url(#${id}-run)`} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <g ref={dot} style={{ opacity: 0 }}>
        <circle r={width * 4.5} fill={`url(#${id}-glow)`} />
        <circle r={width * 1.2} className="fill-amber-500" />
      </g>
    </g>
  );
}
