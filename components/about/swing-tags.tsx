"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Three swing tags in Mimi's words, hanging on one yarn thread. They drop in and swing when the thread
// draws itself, sway a little with fast scrolling, follow a finger or mouse when dragged sideways and swing
// back when let go. Each turns over once by itself, at its own moment, then only when tapped. Nothing on
// the page says so: whoever finds it, finds it. On phones they hang in a chain, each tied under the last.

export type SwingTag = { title: string; text: string; note: string; tone: "amber" | "orange" | "rose" };

const tones = {
  amber: { face: "bg-amber-200", stitch: "border-amber-500" },
  orange: { face: "bg-orange-200", stitch: "border-orange-400" },
  rose: { face: "bg-rose-200", stitch: "border-rose-400" },
};

/** When each tag turns over by itself (ms of being fully on screen): never together, never left to right.
 *  On phones each tag comes into view on its own, so they wait about the same. */
const turnAt = { desktop: [4600, 3000, 6200], phone: [3000, 4800, 3600] };
const showBack = 2800;
/** A hanging tag: loose enough to swing a few times, then settle. */
const swing = { type: "spring", stiffness: 110, damping: 6 } as const;
/** Desktop: how far the thread sags at each tag (px below its ends), so the strings meet it. */
const sag = [30, 48, 30];

const deg = (rad: number) => (rad * 180) / Math.PI;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Past 35° the tag resists, like a string pulled tight. */
const rubber = (a: number) => (Math.abs(a) <= 35 ? a : Math.sign(a) * (35 + (Math.abs(a) - 35) * 0.2));

export function SwingTags({ tags }: { tags: SwingTag[] }) {
  const reduce = !!useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const arrived = useInView(section, { once: true, amount: 0.35 });
  const { scrollY } = useScroll();
  const speed = useSpring(useVelocity(scrollY), { stiffness: 120, damping: 30 });
  const sway = useTransform(speed, [-3000, 0, 3000], [-5, 0, 5]);
  const shared = { reduce, arrived, sway };

  return (
    <section ref={section} className="relative overflow-x-clip pt-10 pb-12 lg:pt-[72px] lg:pb-24">
      <h2 className="sr-only">In Mimi’s words</h2>

      {/* Phone: one thread, the tags tied one under another */}
      <PhoneChain tags={tags} {...shared} />

      {/* Desktop: three tags side by side on one long thread */}
      <Row tags={tags} {...shared} />
    </section>
  );
}

type Shared = { reduce: boolean; arrived: boolean; sway: MotionValue<number> };

function Thread({ d, reduce, arrived }: { d: string } & Shared) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="#f87171"
      strokeWidth="2.5"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      initial={reduce ? false : { pathLength: 0 }}
      animate={arrived ? { pathLength: 1 } : undefined}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

/** A smooth curve through the points (Catmull-Rom as cubic Béziers). */
function curve(p: [number, number][]) {
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i], b = p[i], c = p[i + 1], e = p[i + 2] ?? c;
    d += ` C${b[0] + (c[0] - a[0]) / 6} ${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6} ${c[1] - (e[1] - b[1]) / 6} ${c[0]} ${c[1]}`;
  }
  return d;
}
const threadThrough = (w: number, xs: number[]) => curve([[0, 2], ...xs.map((x, i): [number, number] => [x, 2 + sag[i]]), [w, 2]]);

function Row({ tags, ...shared }: { tags: SwingTag[] } & Shared) {
  const wrap = useRef<HTMLDivElement>(null);
  const cols = useRef<(HTMLDivElement | null)[]>([]);
  // Until it's measured, the thread is drawn for a 1440px window (it's hidden until it draws in anyway).
  const [d, setD] = useState(() => threadThrough(1440, [274.67, 720, 1165.33]));

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const xs = cols.current.map((c) => (c ? c.getBoundingClientRect().left - box.left + c.offsetWidth / 2 : 0));
      setD(threadThrough(box.width, xs));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrap} className="relative max-lg:hidden">
      <svg className="pointer-events-none absolute inset-x-0 top-0 h-[60px] w-full overflow-visible" aria-hidden>
        <Thread d={d} {...shared} />
      </svg>
      <div className="container-page grid grid-cols-3 gap-6">
        {tags.map((t, i) => (
          <div key={t.title} ref={(n) => { cols.current[i] = n; }} style={{ paddingTop: 2 + sag[i] }}>
            <Tag tag={t} index={i} size="desktop" {...shared} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The thread is drawn in real pixels for the screen's width: stretched, its draw-in breaks into dashes. */
function PhoneChain({ tags, ...shared }: { tags: SwingTag[] } & Shared) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(393);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Ends 2px down, lowest (22px) in the middle, where the first tag hangs.
  return (
    <div ref={wrap} className="relative px-5 lg:hidden">
      <svg className="pointer-events-none absolute inset-x-0 top-0 h-[44px] w-full overflow-visible" aria-hidden>
        <Thread d={`M0 2 Q${w / 2} 42 ${w} 2`} {...shared} />
      </svg>
      <div className="pt-[22px]">
        <Chain tags={tags} i={0} {...shared} />
      </div>
    </div>
  );
}

function Chain({ tags, i, parent, ...shared }: { tags: SwingTag[]; i: number; parent?: MotionValue<number> } & Shared) {
  if (i >= tags.length) return null;
  return (
    <Tag tag={tags[i]} index={i} size="phone" parent={parent} {...shared}>
      {(rotate) => <Chain tags={tags} i={i + 1} parent={rotate} {...shared} />}
    </Tag>
  );
}

const sizes = {
  desktop: {
    hang: "w-full max-w-[380px]",
    string: 44,
    top: 22,
    face: "min-h-[208px] px-7 pt-[52px] pb-7 xl:px-8",
    stitch: "inset-2.5 rounded-[12px]",
    eyelet: "top-[13px] size-[18px]",
    title: "text-[24px] xl:text-[28px]",
    text: "mt-2.5 text-[16px]",
    back: "pt-11 pb-9",
    note: "text-[20px] xl:text-[22px]",
  },
  phone: {
    hang: "w-full max-w-[320px]",
    string: 30,
    top: 10,
    face: "min-h-[188px] px-6 pt-11 pb-[22px]",
    stitch: "inset-2 rounded-[14px]",
    eyelet: "top-3 size-4",
    title: "text-[22px]",
    text: "mt-1.5 text-[15px]",
    back: "pt-9 pb-[30px]",
    note: "text-[19px]",
  },
};

type TagProps = { tag: SwingTag; index: number; size: "desktop" | "phone"; parent?: MotionValue<number>; children?: (rotate: MotionValue<number>) => ReactNode } & Shared;

function Tag({ tag, index, size, parent, children, reduce, arrived, sway }: TagProps) {
  const s = sizes[size];
  const tone = tones[tag.tone];
  // A tag lower in the chain hangs from the bottom of the one above: a shorter tie.
  const chained = !!parent;
  const stringLen = chained ? 38 : s.string;
  const tagTop = chained ? 18 : s.top;

  const angle = useMotionValue(0);
  const still = useMotionValue(0);
  // Lower in the chain, a tag trails the one above it when that one swings.
  const lag = useSpring(useTransform(useVelocity(parent ?? still), (v) => clamp(-v * 0.04, -16, 16)), { stiffness: 140, damping: 9 });
  const dir = index % 2 ? 1 : -1;
  const rotate = useTransform(() => angle.get() + (reduce ? 0 : sway.get() * dir + lag.get()));

  const pivot = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const seen = useInView(button, { amount: 0.9 });
  const [turns, setTurns] = useState(0);
  const back = turns % 2 === 1;
  const touched = useRef(false);
  const selfTurned = useRef(false);
  const drag = useRef<{ id: number; x: number; y: number; cx: number; cy: number; a0: number; from: number; moved: boolean; t: number; a: number; v: number } | null>(null);
  const dragged = useRef(false);

  const kick = (v: number) => {
    if (reduce) return;
    animate(angle, 0, { ...swing, velocity: angle.getVelocity() + v });
  };
  const turn = () => {
    setTurns((n) => n + 1);
    kick(dir * 70);
  };

  // Landing on the thread: it drops in with a swing.
  useEffect(() => {
    if (!arrived || reduce) return;
    const t = setTimeout(() => kick(dir * -130), 560 + index * 140);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrived]);

  // Once, by itself, while it's on screen: turn over, show the back for a moment, turn back. Scrolled away
  // before then, it waits for the next time it's seen. A tap first cancels it.
  useEffect(() => {
    if (!seen || selfTurned.current) return;
    const over = setTimeout(() => {
      if (touched.current) return;
      selfTurned.current = true;
      turn();
      setTimeout(() => !touched.current && turn(), showBack);
    }, turnAt[size][index]);
    return () => clearTimeout(over);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragged.current = false;
    if (reduce || e.button !== 0 || !pivot.current) return;
    const p = pivot.current.getBoundingClientRect();
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: p.left, cy: p.top, a0: angle.get(), from: deg(Math.atan2(e.clientX - p.left, e.clientY - p.top)), moved: false, t: e.timeStamp, a: angle.get(), v: 0 };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
      d.moved = true;
      angle.stop();
      d.a0 = angle.get();
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // The tag turns about its string, so the spot under the finger stays under the finger.
    const a = rubber(d.a0 - (deg(Math.atan2(e.clientX - d.cx, e.clientY - d.cy)) - d.from));
    const dt = e.timeStamp - d.t;
    if (dt > 0) d.v = 0.7 * (((a - d.a) / dt) * 1000) + 0.3 * d.v;
    d.t = e.timeStamp;
    d.a = a;
    angle.set(a);
  };
  const release = (e: React.PointerEvent<HTMLButtonElement>, keepSpeed: boolean) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return; // a tap: the click turns it over
    dragged.current = true;
    animate(angle, 0, { ...swing, velocity: keepSpeed ? clamp(d.v, -900, 900) : 0 });
  };
  // A mouse brushing past nudges it, away from the side it came in on.
  const onPointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse" || drag.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    kick(e.clientX < r.left + r.width / 2 ? -40 : 40);
  };
  const onClick = () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    touched.current = true;
    turn();
  };

  const face = `[grid-area:1/1] relative flex flex-col rounded-[22px] ${tone.face} ${s.face} shadow-[0_12px_24px_-12px_rgb(28_25_23/0.28)]`;
  const stitch = <span className={`pointer-events-none absolute border-[1.5px] border-dashed ${tone.stitch} ${s.stitch}`} aria-hidden />;
  const eyelet = <span className={`absolute left-1/2 -translate-x-1/2 rounded-full border-[3px] border-stone-300 bg-orange-50 ${s.eyelet}`} aria-hidden />;
  const flat = reduce ? { opacity: back ? 0 : 1 } : undefined;

  return (
    // flow-root: the tag's top margin stays inside, so the string starts at the pivot, on the thread.
    <motion.div
      className={`relative mx-auto flow-root ${s.hang}`}
      style={{ rotate, transformOrigin: "50% 0%" }}
      initial={reduce ? false : { opacity: 0, y: -28 }}
      animate={arrived ? { opacity: 1, y: 0 } : undefined}
      transition={{ y: { type: "spring", stiffness: 260, damping: 20, delay: 0.45 + index * 0.14 }, opacity: { duration: 0.25, delay: 0.45 + index * 0.14 } }}
    >
      <span ref={pivot} className="absolute top-0 left-1/2 size-0" aria-hidden />
      <span className="pointer-events-none absolute top-0 left-1/2 z-10 w-0.5 -translate-x-1/2 rounded-full bg-red-400" style={{ height: stringLen }} aria-hidden />
      <button
        ref={button}
        type="button"
        className="relative block w-full cursor-pointer touch-pan-y rounded-[22px] text-left select-none focus-visible:rounded-[22px]"
        style={{ marginTop: tagTop, perspective: 1000 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => release(e, true)}
        onPointerCancel={(e) => release(e, false)}
        onPointerEnter={onPointerEnter}
        onClick={onClick}
      >
        <motion.span
          className="grid [transform-style:preserve-3d]"
          animate={reduce ? undefined : { rotateY: turns * 180 }}
          transition={{ type: "spring", stiffness: 120, damping: 15 }}
        >
          <motion.span className={`${face} [backface-visibility:hidden]`} animate={flat} transition={{ duration: 0.25 }}>
            {stitch}
            {eyelet}
            <span className={`relative font-serif leading-tight text-stone-900 ${s.title}`}>{tag.title}</span>
            <span className={`relative leading-[1.5] text-stone-700 ${s.text}`}>{tag.text}</span>
          </motion.span>
          <motion.span
            className={`${face} justify-center [backface-visibility:hidden] ${reduce ? "" : "[transform:rotateY(180deg)]"} ${s.back}`}
            initial={reduce ? { opacity: 0 } : false}
            animate={reduce ? { opacity: back ? 1 : 0 } : undefined}
            transition={{ duration: 0.25 }}
          >
            {stitch}
            {eyelet}
            <span className={`relative font-serif leading-[1.35] text-stone-800 ${s.note}`}>{tag.note}</span>
          </motion.span>
        </motion.span>
      </button>
      {children?.(rotate)}
    </motion.div>
  );
}
