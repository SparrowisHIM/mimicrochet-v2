"use client";

import Image from "next/image";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { Flow } from "@/components/motion/flow";
import { RevealText } from "@/components/motion/reveal";
import { StageIcon } from "@/components/home/stage-icons";
import { ButtonLink } from "@/components/ui/button";
import { demoOrder } from "@/lib/orders";
import { formatNaira } from "@/lib/site";
import { stages } from "@/lib/stages";
import { useChase } from "@/lib/use-chase";
import { useMedia } from "@/lib/use-media";

// One order told start to finish: the Ruby Dress, from the idea to Mimi's packed bag.
// Desktop: the stage list scrolls normally and the photo beside it follows the scroll exactly,
// so fast scrolling or scrolling back up can never skip a stage. Phones: tap or swipe.

type Media = { kind: "image"; src: string; position?: string } | { kind: "video"; src: string; poster: string };
type Stage = { tag: string; media: Media; alt: string; title: string; detail: string; caption: string };

const story: Stage[] = [
  {
    tag: "The Ruby Dress",
    media: { kind: "image", src: "/images/story/hero-ruby.jpg" },
    alt: "The full Ruby crochet set laid flat beside red yarn",
    title: "Start with a little inspiration.",
    detail: "A saved photo, a colour you love, an idea you can’t shake. Give Mimi a starting point.",
    caption: "The idea: a red set with a little movement.",
  },
  {
    tag: "The Ruby Dress",
    media: { kind: "image", src: "/images/story/ruby-plan.jpg" },
    alt: "The red yarn picked for the Ruby Dress beside the first panel",
    title: "Make a plan together.",
    detail: "Agree your measurements, price and timing on WhatsApp. A 60% deposit, or the full price, gets things moving.",
    caption: "",
  },
  {
    tag: "The Ruby Dress",
    media: { kind: "video", src: "/video/ruby-taking-shape.mp4", poster: "/images/story/ruby-taking-shape.jpg" },
    alt: "Mimi’s hook over the Ruby skirt panel as it takes shape",
    title: "Watch your piece take shape.",
    detail: "Mimi shares the details as she works, so you can follow the making from your phone.",
    caption: "The skirt panel, one row at a time.",
  },
  {
    tag: "The Ruby Dress",
    media: { kind: "image", src: "/images/products/red-fringe-beach-set-1.jpg" },
    alt: "The complete Ruby Dress with its fringe, on Mimi’s mannequin",
    title: "Every last detail, finished.",
    detail: "See the finished piece, settle the 40% if you paid a deposit, and agree delivery with Mimi.",
    caption: "Finished. Every fringe in place.",
  },
  {
    tag: "The Ruby Dress",
    media: { kind: "image", src: "/images/story/packed-order.jpg" },
    alt: "A finished order sealed in Mimi’s white Mimicrochet bag, printed with her logo and “Thanks for your patronage”",
    title: "Now, make it your own.",
    detail: "Your piece arrives sealed in Mimi’s own bag, ready to wear. Delivery is arranged to your address.",
    caption: "Sealed in Mimi’s bag and on its way to your door.",
  },
];

const last = story.length - 1;
// Phones play the story by themselves while it's on screen: 3s per photo (time to read Mimi's line),
// and the video stage lasts exactly as long as the video, so it always plays to the end.
const IMAGE_MS = 3000;
// If the video can't play at all, the story still moves on after this long.
const VIDEO_STALL_MS = 15000;
// What Mimi's latest note says at each stage, on the same card customers see on their tracking page.
const notes = story.map((s, i) =>
  i === 1 ? `Price agreed: ${formatNaira(demoOrder.price ?? 0)}, ready by ${demoOrder.readyBy}. Deposit paid, so the yarn is picked.` : s.caption,
);

/* --------------------------------- the photo stack --------------------------------- */

// Each layer sits above the one before it and wipes up into view as the scroll position
// reaches its stage, so the change is exact in both directions and never cross-fades two photos.
// The wipe runs between i-0.8 and i-0.2, so each photo holds still while its stage is centred.
type LayerProps = {
  i: number;
  pos: MotionValue<number>;
  active: number;
  reduce: boolean;
  /** Desktop loops the video; phones play it once and move on when it ends. */
  loop: boolean;
  /** The section is close, so the video starts downloading before its stage comes up. */
  near: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
};

function Layer({ i, pos, active, reduce, loop, near, videoRef: video }: LayerProps) {
  const s = story[i];
  const clip = useTransform(pos, [i - 0.8, i - 0.2], ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"]);
  const zoom = useTransform(pos, [i - 0.8, i - 0.2], [1.18, 1]);
  const showing = active === i;

  useEffect(() => {
    const v = video.current;
    if (!v || s.media.kind !== "video") return;
    if (showing && !reduce) v.play().catch(() => {});
    else v.pause();
  }, [showing, reduce, video, s.media.kind]);

  const style = reduce ? { opacity: i <= active ? 1 : 0 } : i === 0 ? undefined : { clipPath: clip };
  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={style} aria-hidden={!showing}>
      <motion.div className="absolute inset-0" style={reduce ? undefined : { scale: zoom }}>
        {s.media.kind === "image" ? (
          <Image src={s.media.src} alt={s.alt} fill sizes="(min-width: 1024px) 520px, 92vw" className="object-cover" style={{ objectPosition: s.media.position }} />
        ) : (
          <video ref={video} className="size-full object-cover" src={s.media.src} poster={near ? s.media.poster : undefined} muted loop={loop} playsInline preload={near ? "auto" : "none"} aria-label={s.alt} />
        )}
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------- the flow --------------------------------- */

// Desktop: every stage is an outlined card, and one channel links them top to bottom. A short run of
// amber flows down each link, round the card's edge (along the top, down the right, back along the
// bottom) and out to the next stage, so it's always going round the stage you're reading. Your scroll
// sets where it's heading and it follows at its own pace, never faster than it can be seen, so a hard
// flick still plays out as a flow. Its tail stretches as it speeds up, and each stage it reaches
// lights up with one warm ring. Scroll back and it flows back.

const CARD_RADIUS = 22;
const CARD_TAIL = 240;

type Channel = { w: number; h: number; links: string; path: string; mids: number[]; spans: [number, number][]; end: number };

function channelOf(list: HTMLElement, cards: (HTMLElement | null)[]): Channel | null {
  const box = list.getBoundingClientRect();
  const rs = cards.map((c) => c?.getBoundingClientRect());
  if (!rs.length || rs.some((r) => !r?.width)) return null;
  const r = CARD_RADIUS - 0.5;
  // The channel runs down the number circles' column: 20px padding plus half the 32px circle.
  const x = rs[0]!.left - box.left + 36;
  const top = rs[0]!.top - box.top + 0.5;
  let path = `M${x} 0 V${top}`;
  let links = path;
  let len = top;
  const mids: number[] = [];
  const spans: [number, number][] = [];
  rs.forEach((c, i) => {
    const t = c!.top - box.top + 0.5;
    const b = c!.bottom - box.top - 0.5;
    const right = c!.right - box.left - 0.5;
    const across = right - r - x;
    const arc = (Math.PI * r) / 2;
    const side = b - t - 2 * r;
    path += ` H${right - r} A${r} ${r} 0 0 1 ${right} ${t + r} V${b - r} A${r} ${r} 0 0 1 ${right - r} ${b} H${x}`;
    // A stage is "being read" when the flow is halfway down its right edge.
    mids.push(len + across + arc + side / 2);
    spans.push([len, len + 2 * across + 2 * arc + side]);
    len += 2 * across + 2 * arc + side;
    const next = i < rs.length - 1 ? rs[i + 1]!.top - box.top + 0.5 : box.height;
    path += ` V${next}`;
    links += ` M${x} ${b} V${next}`;
    len += next - b;
  });
  return { w: box.width, h: box.height, links, path, mids, spans, end: len };
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Where the flow's head is for a scroll position: -1 is still above the list, `last + 1` has drained out below it. */
function headAt(q: number, g: Channel) {
  const v = Math.max(-1, Math.min(last + 1, q));
  if (v < 0) return mix(-1, g.mids[0], v + 1);
  if (v >= last) return mix(g.mids[last], g.end + CARD_TAIL, v - last);
  const i = Math.floor(v);
  return mix(g.mids[i], g.mids[i + 1], v - i);
}

function StageChannel({
  list,
  cards,
  q,
  reduce,
  onArrive,
}: {
  list: RefObject<HTMLOListElement | null>;
  cards: RefObject<(HTMLButtonElement | null)[]>;
  q: MotionValue<number>;
  reduce: boolean;
  /** The flow has just entered this stage's card (-1: it's back above the list). */
  onArrive: (i: number) => void;
}) {
  const [geo, setGeo] = useState<Channel | null>(null);
  const geoRef = useRef<Channel | null>(null);
  const target = useMotionValue(-1);
  const { value: head, speed } = useChase(target, { rate: 2.4, max: 900, grip: 4, within: 1.1, on: !reduce });
  const tail = useTransform(speed, (v) => CARD_TAIL + Math.min(420, Math.abs(v) * 0.32));
  const follow = (v: number) => {
    if (geoRef.current) target.set(headAt(v, geoRef.current));
  };
  useMotionValueEvent(q, "change", follow);

  const inside = useRef(-2);
  useMotionValueEvent(head, "change", (h) => {
    const g = geoRef.current;
    if (!g) return;
    const i = h < g.spans[0][0] ? -1 : g.spans.findIndex(([a, b]) => h >= a && h <= b);
    if (i !== -1 || h < g.spans[0][0]) {
      if (i !== inside.current) {
        inside.current = i;
        onArrive(i);
      }
    }
  });

  const layout = useEffectEvent(() => {
    const el = list.current;
    if (!el) return;
    const g = channelOf(el, cards.current);
    geoRef.current = g;
    setGeo(g);
    follow(q.get());
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
  }, [list]);

  if (!geo) return null;
  return (
    <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width={geo.w} height={geo.h} aria-hidden>
      <path d={geo.links} fill="none" className="stroke-stone-300" strokeWidth={1} />
      {!reduce && <Flow d={geo.path} head={head} tail={tail} width={3.5} />}
    </svg>
  );
}

// Phones: the stage buttons are linked the same way. While a stage plays, the flow splits round its
// button, over the top and under the bottom, and the two runs meet on the far side as the stage ends
// (3s for a photo, the video's own length), then drain away and the next button starts.

const CHIP_RADIUS = 14;
const CHIP_TAIL = 46;

type Chips = { w: number; h: number; pipes: string; boxes: { x0: number; x1: number; y0: number; y1: number }[] };

function ChipFlow({ row, chips, active, progress, playing }: { row: RefObject<HTMLDivElement | null>; chips: RefObject<(HTMLButtonElement | null)[]>; active: number; progress: MotionValue<number>; playing: boolean }) {
  const [geo, setGeo] = useState<Chips | null>(null);
  const layout = useEffectEvent(() => {
    const el = row.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const rs = chips.current.map((c) => c?.getBoundingClientRect());
    if (!box.width || rs.some((r) => !r?.width)) return setGeo(null);
    const boxes = rs.map((r) => ({ x0: r!.left - box.left + 0.5, x1: r!.right - box.left - 0.5, y0: r!.top - box.top + 0.5, y1: r!.bottom - box.top - 0.5 }));
    const pipes = boxes
      .slice(0, -1)
      .map((b, i) => `M${b.x1 + 0.5} ${(b.y0 + b.y1) / 2} H${boxes[i + 1].x0 - 0.5}`)
      .join(" ");
    setGeo({ w: box.width, h: box.height, pipes, boxes });
  });
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    // The observer reports once as soon as it starts watching, so this also draws the first layout.
    const ro = new ResizeObserver(() => layout());
    ro.observe(el);
    return () => ro.disconnect();
  }, [row]);

  const b = geo?.boxes[active];
  const r = CHIP_RADIUS - 0.5;
  const mid = b ? (b.y0 + b.y1) / 2 : 0;
  const half = b ? 2 * (mid - b.y0 - r) + Math.PI * r + (b.x1 - b.x0 - 2 * r) : 0;
  // The runs meet on the far side at 90% of the stage's time and drain away in the last 10%.
  const head = useMotionValue(0);
  useMotionValueEvent(progress, "change", (p) => head.set(p < 0.9 ? (p / 0.9) * half : half + ((p - 0.9) / 0.1) * CHIP_TAIL));

  if (!geo || !b) return null;
  const over = `M${b.x0} ${mid} V${b.y0 + r} A${r} ${r} 0 0 1 ${b.x0 + r} ${b.y0} H${b.x1 - r} A${r} ${r} 0 0 1 ${b.x1} ${b.y0 + r} V${mid}`;
  const under = `M${b.x0} ${mid} V${b.y1 - r} A${r} ${r} 0 0 0 ${b.x0 + r} ${b.y1} H${b.x1 - r} A${r} ${r} 0 0 0 ${b.x1} ${b.y1 - r} V${mid}`;
  return (
    <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width={geo.w} height={geo.h} aria-hidden>
      <path d={geo.pipes} fill="none" className="stroke-stone-300" strokeWidth={1} />
      {playing && (
        <g key={active}>
          <Flow d={over} head={head} tail={CHIP_TAIL} width={2} />
          <Flow d={under} head={head} tail={CHIP_TAIL} width={2} />
        </g>
      )}
    </svg>
  );
}

/* --------------------------------- the section --------------------------------- */

export function OrderStory() {
  const reduce = Boolean(useReducedMotion());
  const desktop = useMedia("(min-width: 1024px)");
  const [active, setActive] = useState(0);
  const pos = useMotionValue(0);
  // The same position, but it carries on a stage's worth before the first and after the last,
  // so the flow can run in from above the list and drain out below it.
  const flow = useMotionValue(-1);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const list = useRef<HTMLOListElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  // Desktop: the card that lights up is the one the flow has reached, and it sends out a ring as it does.
  const [lit, setLit] = useState(-1);
  const [ring, setRing] = useState(0);
  const arrive = (i: number) => {
    setLit(i);
    if (i >= 0) setRing((n) => n + 1);
  };

  // Where the stage list sits against a focus line 45% down the screen, as a continuous number:
  // 1.5 means halfway between stage 2 and stage 3.
  const measure = () => {
    const focus = window.innerHeight * 0.45;
    const c = rows.current.map((r) => {
      const b = r?.getBoundingClientRect();
      return b ? b.top + b.height / 2 : 0;
    });
    let q: number;
    if (focus < c[0]) q = Math.max(-1, (focus - c[0]) / (c[1] - c[0]));
    else if (focus >= c[last]) q = Math.min(last + 1, last + (focus - c[last]) / (c[last] - c[last - 1]));
    else {
      const k = c.findIndex((v, n) => focus >= v && focus < c[n + 1]);
      q = k + (focus - c[k]) / (c[k + 1] - c[k]);
    }
    flow.set(q);
    const p = Math.max(0, Math.min(last, q));
    pos.set(p);
    const a = Math.round(p);
    setActive((cur) => (cur === a ? cur : a));
  };

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", () => {
    if (desktop) measure();
  });
  const onLayout = useEffectEvent(() => {
    if (desktop) measure();
  });
  useEffect(() => {
    const id = requestAnimationFrame(() => onLayout());
    const resize = () => onLayout();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", resize);
    };
  }, [desktop]);

  /** Desktop: scroll the list so the stage meets the focus line. Phones: wipe straight to it. */
  const go = (i: number, rewind = false) => {
    const to = Math.max(0, Math.min(last, i));
    if (desktop) {
      const r = rows.current[to]?.getBoundingClientRect();
      if (r) window.scrollTo({ top: window.scrollY + r.top + r.height / 2 - window.innerHeight * 0.45, behavior: reduce ? "auto" : "smooth" });
      return;
    }
    if (to === active) return;
    // A jump of several stages wipes in from the neighbouring stage; the autoplay rewind runs back through them all.
    if (!rewind && Math.abs(to - active) > 1) pos.jump(to - Math.sign(to - active));
    setActive(to);
    if (reduce) pos.jump(to);
    else animate(pos, to, rewind ? { type: "spring", duration: 0.9, bounce: 0 } : { type: "spring", stiffness: 170, damping: 26 });
  };

  // Phones: advance on a timer while the photo is on screen. Tapping or swiping restarts the clock.
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const clip = useRef<HTMLVideoElement>(null);
  const near = useInView(section, { margin: "100% 0px", once: true });
  const onScreen = useInView(frame, { amount: 0.5 });
  const autoplay = !desktop && !reduce && onScreen;
  const onVideo = story[active].media.kind === "video";
  const clipProgress = useMotionValue(0);
  const imageProgress = useMotionValue(0);
  const chipRow = useRef<HTMLDivElement>(null);
  const chips = useRef<(HTMLButtonElement | null)[]>([]);
  const advance = useEffectEvent(() => go(active === last ? 0 : active + 1, active === last));
  useEffect(() => {
    if (!autoplay) return;
    if (!onVideo) {
      imageProgress.set(0);
      const run = animate(imageProgress, 1, { duration: IMAGE_MS / 1000, ease: "linear" });
      const t = setTimeout(() => advance(), IMAGE_MS);
      return () => {
        run.stop();
        clearTimeout(t);
      };
    }
    // The video stage: play from the top, fill the bar with the real playback (it waits if the video
    // buffers), and move on when the video ends.
    const v = clip.current;
    if (!v) return;
    clipProgress.set(0);
    v.currentTime = 0;
    v.play().catch(() => {});
    let raf = requestAnimationFrame(function tick() {
      if (v.duration) clipProgress.set(v.currentTime / v.duration);
      raf = requestAnimationFrame(tick);
    });
    const done = () => advance();
    v.addEventListener("ended", done);
    const stall = setTimeout(() => advance(), VIDEO_STALL_MS);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("ended", done);
      clearTimeout(stall);
    };
  }, [autoplay, active, onVideo, clipProgress, imageProgress]);

  const current = story[active];

  return (
    <section ref={section} className="border-y border-stone-200/70 bg-orange-50 py-16 lg:py-24" aria-labelledby="order-story-heading">
      <div className="container-page">
        <div className="mb-9 flex flex-col gap-5 lg:mb-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <RevealText id="order-story-heading" text={"From idea\nto doorstep."} className="max-w-[680px] font-serif text-[38px] leading-[1.08] tracking-[-0.025em] lg:text-[60px]" />
          <p className="max-w-[355px] text-[16px] leading-relaxed text-stone-600 lg:pb-1 lg:text-[18px]">You bring the idea, Mimi brings the hook. Here’s how a piece becomes yours.</p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
          {/* Desktop: the stage list, outlined cards on one channel with the flow running through it */}
          {/* The space under the button keeps the photo fully on screen while the last stage is centred. */}
          <div className="hidden lg:block lg:pb-[24vh]">
            <div className="relative">
              <ol ref={list} aria-label="Order stages">
                {story.map((s, i) => {
                  const on = reduce ? i === active : i === lit;
                  const quiet = on ? "" : "opacity-45 group-hover:opacity-80";
                  return (
                    <li key={s.title} ref={(el) => { rows.current[i] = el; }} className="flex min-h-[36vh] items-center">
                      <button
                        ref={(el) => { cards.current[i] = el; }}
                        type="button"
                        onClick={() => go(i)}
                        aria-current={on ? "step" : undefined}
                        className="group relative flex w-full gap-5 rounded-[22px] border border-stone-300 px-5 py-6 text-left"
                      >
                        {/* The stage being read lights up where it is; nothing slides between stages. */}
                        <span className={`absolute inset-0 rounded-[21px] bg-white shadow-[0_12px_32px_-24px_rgb(28_25_23/0.3)] transition-opacity duration-500 ease-out ${on ? "opacity-100" : "opacity-0"}`} aria-hidden />
                        {on && !reduce && ring > 0 && <span key={ring} className="pointer-events-none absolute -inset-px animate-[flow-arrive_1.1s_cubic-bezier(0.22,1,0.36,1)_both] rounded-[22px] border" aria-hidden />}
                        <span className={`relative mt-1 grid size-8 shrink-0 place-items-center rounded-full border text-[12px] font-semibold tabular-nums transition-[color,background-color,border-color,opacity] duration-300 ${on ? "border-stone-900 bg-stone-900 text-orange-50" : "border-stone-300 bg-orange-50 text-stone-500"} ${quiet}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className={`relative flex flex-col gap-2 transition-opacity duration-200 ${quiet}`}>
                          <span className={`text-[13px] font-semibold ${on ? "text-amber-800" : "text-stone-500"}`}>{stages[i].label}</span>
                          <span className="font-serif text-[26px] leading-tight">{s.title}</span>
                          <span className="max-w-[380px] text-[16px] leading-relaxed text-stone-600">{s.detail}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <StageChannel list={list} cards={cards} q={flow} reduce={reduce} onArrive={arrive} />
            </div>
            <div className="pl-5">
              <ButtonLink href="/custom-order">Let’s make your piece</ButtonLink>
            </div>
          </div>

          {/* The photo, with the tag on top and the order's tracking card tucked under its bottom edge */}
          <div className="lg:sticky lg:top-24">
            <div ref={chipRow} className="relative mb-4 flex justify-between gap-1.5 lg:hidden" role="group" aria-label="Choose an order stage">
              {stages.map((st, i) => (
                <button
                  key={st.key}
                  ref={(el) => { chips.current[i] = el; }}
                  type="button"
                  aria-pressed={i === active}
                  aria-label={st.label}
                  onClick={() => go(i)}
                  className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[14px] border text-[11px] font-medium transition-colors ${
                    i === active ? "border-stone-900 bg-stone-900 text-orange-50" : "border-stone-200 bg-white text-stone-600"
                  }`}
                >
                  <span className="text-[13px] tabular-nums">{i + 1}</span>
                  {st.short}
                </button>
              ))}
              <ChipFlow row={chipRow} chips={chips} active={active} progress={onVideo ? clipProgress : imageProgress} playing={autoplay} />
            </div>

            {/* Desktop: the photo is sized so it and Mimi's line under it fit the sticky column. */}
            <div className="mx-auto w-full rounded-[22px] border border-stone-200 bg-white p-2.5 shadow-[0_30px_70px_-40px_rgb(28_25_23/0.4)] lg:max-w-[min(100%,calc((100svh-272px)*0.75+24px))] lg:p-3">
              <div className="flex items-center justify-between px-2 pt-1 pb-3 text-[13px] font-medium text-stone-500">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={current.tag} className="font-semibold text-stone-900" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ type: "spring", duration: 0.3, bounce: 0 }}>
                    {current.tag}
                  </motion.span>
                </AnimatePresence>
                <span className="tabular-nums">
                  {active + 1} of {story.length}
                </span>
              </div>
              <motion.div
                ref={frame}
                className="relative aspect-[3/4] w-full touch-pan-y overflow-hidden rounded-[12px] bg-stone-200 lg:rounded-[10px]"
                drag={desktop ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) go(active + 1);
                  else if (info.offset.x > 50) go(active - 1);
                }}
              >
                {story.map((s, i) => (
                  <Layer key={s.title} i={i} pos={pos} active={active} reduce={reduce} loop={desktop} near={near} videoRef={clip} />
                ))}
              </motion.div>
              {/* Mimi's line for this stage, under the photo (never over it), like a caption, led by the stage's own animated icon. */}
              <div className="flex items-start gap-2.5 px-2 pt-3.5 pb-1.5">
                <StageIcon stage={active} />
                <div className="relative min-h-[2.75rem] min-w-0 flex-1" aria-live="polite">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.p
                      key={active}
                      className="flex flex-col gap-0.5"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.15 } }}
                      transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                    >
                      <span className={`text-[12px] font-semibold ${active >= 3 ? "text-emerald-800" : "text-amber-800"}`}>{stages[active].label}</span>
                      <span className="text-[15px] leading-snug text-stone-700">{notes[active]}</span>
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 lg:hidden" aria-live="polite">
              <h3 className="font-serif text-[23px] leading-tight">{current.title}</h3>
              <p className="text-[15px] leading-relaxed text-stone-600">{current.detail}</p>
              <p className="text-[13px] text-stone-500">It plays by itself. Swipe the photo or tap a stage to jump.</p>
              <div className="pt-2">
                <ButtonLink href="/custom-order" className="max-sm:w-full">Let’s make your piece</ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
