"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { InViewVideo } from "@/components/about/about-motion";
import { linkClass } from "@/components/ui/button";
import { useChase } from "@/lib/use-chase";

export type Step = { n: string; title: string; text: string; src: string; alt: string; tag?: string; video?: string; href?: string };

// A chain stitch links 01 to 04: a row of the little ovals crochet charts use for a chain. It stitches
// itself in, one loop at a time, as the steps come on screen, led by a glowing hook, and each number
// pops like a knot as the stitch reaches it. The scroll decides how far it goes; the stitch gets
// there at its own steady pace, so a fast scroll still plays out loop by loop. Scrolling back unpicks
// it. On phones, where the steps swipe sideways, it only stitches as far as you've swiped. Reduced
// motion: drawn complete.

type Loop = { x: number; gap: number };
type Chain = { w: number; h: number; cy: number; rx: number; ry: number; step: number; loops: Loop[]; from: number; to: number; numbers: number[] };

const PAD = 12; // space between a number and the first loop

// Each step wipes in from the top once, like the page's other sections. The list item is what's
// watched, not the clipped card: a card clipped to nothing never counts as on screen, so steps
// swiped in from the side on phones would stay hidden.
const wipe = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  shown: { clipPath: "inset(0 0 0% 0)", transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] as const } },
};

function chainOf(list: HTMLOListElement, nums: (HTMLElement | null)[]): Chain | null {
  const box = list.getBoundingClientRect();
  const rs = nums.map((n) => n?.getBoundingClientRect());
  if (rs.some((r) => !r?.width)) return null;
  const big = window.matchMedia("(min-width: 1024px)").matches;
  const w = big ? 11 : 9;
  const step = big ? 13 : 11;
  const xs = rs.map((r) => ({ l: r!.left - box.left + list.scrollLeft, r: r!.right - box.left + list.scrollLeft }));
  const loops: Loop[] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i].r + PAD;
    const b = xs[i + 1].l - PAD;
    const n = Math.max(0, Math.floor((b - a + step - w) / step));
    const off = (b - a - (n * step - (step - w))) / 2;
    for (let k = 0; k < n; k++) loops.push({ x: a + off + k * step + w / 2, gap: i });
  }
  return {
    w: list.scrollWidth,
    h: list.clientHeight,
    cy: rs[0]!.top - box.top + rs[0]!.height / 2 + 1,
    rx: w / 2,
    ry: big ? 3 : 2.5,
    step,
    loops,
    from: xs[0].r + PAD,
    to: xs[xs.length - 1].l - PAD,
    numbers: xs.map((x) => x.l - PAD),
  };
}

// A loop pulls a touch past its size before it settles, like a stitch drawn tight.
const pull = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

export function CraftSteps({ steps }: { steps: Step[] }) {
  const reduce = Boolean(useReducedMotion());
  const list = useRef<HTMLOListElement>(null);
  const nums = useRef<(HTMLSpanElement | null)[]>([]);
  const firstNumber = useRef<HTMLSpanElement>(null);
  const loops = useRef<(SVGEllipseElement | null)[]>([]);
  const hook = useRef<SVGGElement>(null);
  const reached = useRef<boolean[]>([]);
  const [chain, setChain] = useState<Chain | null>(null);
  const chainRef = useRef<Chain | null>(null);
  // Starts as the row of numbers comes up from the bottom of the screen; done by the time it's halfway up.
  const { scrollYProgress } = useScroll({ target: firstNumber, offset: ["start 0.95", "start 0.55"] });
  const { scrollX } = useScroll({ container: list });

  // Where the scroll says the stitch should have got to, and where it actually is (chasing it).
  const goal = useMotionValue(0);
  const { value: front } = useChase(goal, { rate: 2.2, max: 300, grip: 4, within: 2.2, on: !reduce });
  const aim = () => {
    const g = chainRef.current;
    const el = list.current;
    if (!g || !el) return;
    const end = g.to + g.step * 2;
    let x = reduce ? end : g.from + (end - g.from) * scrollYProgress.get();
    // Phones: never stitch past what you've swiped to.
    if (!reduce && el.scrollWidth > el.clientWidth + 1) x = Math.min(x, el.scrollLeft + el.clientWidth * 0.85);
    goal.set(x);
  };
  useMotionValueEvent(scrollYProgress, "change", aim);
  useMotionValueEvent(scrollX, "change", aim);

  const stitch = (at: number) => {
    const g = chainRef.current;
    if (!g) return;
    g.loops.forEach((l, k) => {
      const node = loops.current[k];
      if (!node) return;
      const t = Math.max(0, Math.min(1, (at - l.x + g.step) / (g.step * 1.5)));
      node.style.opacity = String(t);
      node.style.transform = `scale(${0.3 + 0.7 * pull(t)})`;
    });
    // The hook glows at the working end while there's still chain to make.
    const h = hook.current;
    if (h) {
      const working = !reduce && at > g.from + 1 && at < g.to + g.step;
      h.style.opacity = working ? "1" : "0";
      h.setAttribute("transform", `translate(${Math.min(at, g.to)} ${g.cy})`);
    }
    nums.current.forEach((n, i) => {
      if (!n || i === 0) return;
      const got = at >= g.numbers[i];
      n.dataset.waiting = String(!got);
      if (got && !reached.current[i] && !reduce) n.animate([{ transform: "scale(1)" }, { transform: "scale(1.22)" }, { transform: "scale(1)" }], { duration: 520, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
      reached.current[i] = got;
    });
  };
  useMotionValueEvent(front, "change", stitch);

  const layout = useEffectEvent(() => {
    const el = list.current;
    if (!el) return;
    const g = chainOf(el, nums.current);
    chainRef.current = g;
    setChain(g);
    aim();
  });
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    let live = true;
    // The observer reports once as soon as it starts watching, so this also draws the first layout.
    const ro = new ResizeObserver(() => layout());
    ro.observe(el);
    document.fonts?.ready.then(() => live && layout());
    return () => {
      live = false;
      ro.disconnect();
    };
  }, []);
  // Once the loops are drawn, put them in the right state for where the stitch already is.
  useEffect(() => stitch(front.get()));

  return (
    <ol ref={list} className="no-scrollbar relative -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:px-0">
      {steps.map((s, i) => (
        <motion.li
          key={s.n}
          className="w-[72vw] max-w-[300px] shrink-0 snap-start lg:w-auto lg:max-w-none"
          initial={reduce ? false : "hidden"}
          whileInView="shown"
          viewport={{ once: true, margin: "-12% 0px" }}
        >
          <motion.div variants={wipe} className="flex flex-col gap-3.5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-orange-100">
              {s.video ? (
                <InViewVideo src={s.video} poster={s.src} label={s.alt} />
              ) : (
                <Image src={s.src} alt={s.alt} fill sizes="(min-width: 1024px) 310px, 72vw" className="object-cover" />
              )}
              {s.tag && <span className="absolute top-3 left-3 rounded-full bg-white/94 px-2.5 py-1 text-[12px] font-semibold">{s.tag}</span>}
            </div>
            <span
              ref={(el) => {
                nums.current[i] = el;
                if (i === 0) firstNumber.current = el;
              }}
              className="self-start font-serif text-[20px] text-amber-700 transition-colors duration-300 data-[waiting=true]:text-stone-300"
            >
              {s.n}
            </span>
            <h3 className="-mt-1.5 text-[19px] font-medium">{s.title}</h3>
            <p className="text-[15px] leading-[1.5] text-stone-600">{s.text}</p>
            {s.href && (
              <Link href={s.href} className={`${linkClass} self-start`}>
                See this dress
              </Link>
            )}
          </motion.div>
          {/* The chain sits in the first step but spans the whole list, so on phones it swipes with the steps. */}
          {i === 0 && chain && (
            <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width={chain.w} height={chain.h} aria-hidden>
              {chain.loops.map((l, k) => (
                <ellipse
                  key={k}
                  ref={(el) => {
                    loops.current[k] = el;
                  }}
                  cx={l.x}
                  cy={chain.cy}
                  rx={chain.rx}
                  ry={chain.ry}
                  fill="none"
                  className="origin-center stroke-amber-600 [transform-box:fill-box]"
                  strokeWidth={1.5}
                  style={{ opacity: 0 }}
                />
              ))}
              <g ref={hook} className="transition-opacity duration-500" style={{ opacity: 0 }}>
                <circle r={13} fill="url(#stitch-hook)" />
                <circle r={3.5} className="fill-amber-500" />
              </g>
              <defs>
                <radialGradient id="stitch-hook">
                  <stop offset="0" stopColor="currentColor" stopOpacity="0.6" className="text-amber-400" />
                  <stop offset="1" stopColor="currentColor" stopOpacity="0" className="text-amber-400" />
                </radialGradient>
              </defs>
            </svg>
          )}
        </motion.li>
      ))}
    </ol>
  );
}
