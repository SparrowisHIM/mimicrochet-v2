"use client";

import Image from "next/image";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { RevealText } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { demoOrder } from "@/lib/orders";
import { formatNaira } from "@/lib/site";
import { stages } from "@/lib/stages";
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
    detail: "Agree your measurements, price and timing on WhatsApp. Your 60% deposit gets things moving.",
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
    detail: "See the finished piece, settle the remaining 40%, and agree delivery with Mimi.",
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
const deposit = Math.round((demoOrder.price ?? 0) * 0.6);
const plan = [
  ["Size", demoOrder.size ?? "L"],
  ["Price", formatNaira(demoOrder.price ?? 0)],
  ["Ready by", demoOrder.readyBy ?? ""],
  ["Deposit (60%)", `${formatNaira(deposit)} paid`],
] as const;

/* --------------------------------- the photo stack --------------------------------- */

// Each layer sits above the one before it and wipes up into view as the scroll position
// reaches its stage, so the change is exact in both directions and never cross-fades two photos.
// The wipe runs between i-0.8 and i-0.2, so each photo holds still while its stage is centred.
function Layer({ i, pos, active, reduce }: { i: number; pos: MotionValue<number>; active: number; reduce: boolean }) {
  const s = story[i];
  const clip = useTransform(pos, [i - 0.8, i - 0.2], ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"]);
  const zoom = useTransform(pos, [i - 0.8, i - 0.2], [1.18, 1]);
  const video = useRef<HTMLVideoElement>(null);
  const showing = active === i;

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (showing && !reduce) v.play().catch(() => {});
    else v.pause();
  }, [showing, reduce]);

  const style = reduce ? { opacity: i <= active ? 1 : 0 } : i === 0 ? undefined : { clipPath: clip };
  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={style} aria-hidden={!showing}>
      <motion.div className="absolute inset-0" style={reduce ? undefined : { scale: zoom }}>
        {s.media.kind === "image" ? (
          <Image src={s.media.src} alt={s.alt} fill sizes="(min-width: 1024px) 520px, 92vw" className="object-cover" style={{ objectPosition: s.media.position }} preload={i === 0} />
        ) : (
          <video ref={video} className="size-full object-cover" src={s.media.src} poster={s.media.poster} muted loop playsInline preload="none" aria-label={s.alt} />
        )}
      </motion.div>
    </motion.div>
  );
}

function Note({ active }: { active: number }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={active}
        className="absolute inset-x-3 bottom-3 rounded-[18px] bg-white/95 p-4 shadow-[0_18px_40px_-18px_rgb(28_25_23/0.45)] backdrop-blur-md lg:inset-x-4 lg:bottom-4 lg:p-5"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(6px)" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-orange-100 font-serif text-[14px] text-amber-900" aria-hidden>
            M
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[12px] leading-none font-semibold ${active >= 3 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
            {stages[active].label}
          </span>
        </div>
        {active === 1 ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
            {plan.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <dt className="text-[12px] text-stone-500">{k}</dt>
                <dd className={`text-[15px] font-semibold ${k.startsWith("Deposit") ? "text-emerald-800" : ""}`}>{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2.5 text-[15px] leading-snug text-stone-800 lg:text-[16px]">{story[active].caption}</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* --------------------------------- the section --------------------------------- */

export function OrderStory() {
  const reduce = Boolean(useReducedMotion());
  const desktop = useMedia("(min-width: 1024px)");
  const [active, setActive] = useState(0);
  const pos = useMotionValue(0);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const rail = useTransform(pos, [0, last], [0, 1]);

  // Where the stage list sits against a focus line 45% down the screen, as a continuous number:
  // 1.5 means halfway between stage 2 and stage 3.
  const measure = () => {
    const focus = window.innerHeight * 0.45;
    const centers = rows.current.map((r) => {
      const b = r?.getBoundingClientRect();
      return b ? b.top + b.height / 2 : 0;
    });
    let p = 0;
    if (focus >= centers[last]) p = last;
    else if (focus > centers[0]) {
      const k = centers.findIndex((c, n) => focus >= c && focus < centers[n + 1]);
      p = k + (focus - centers[k]) / (centers[k + 1] - centers[k]);
    }
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
  const go = (i: number) => {
    const to = Math.max(0, Math.min(last, i));
    if (desktop) {
      const r = rows.current[to]?.getBoundingClientRect();
      if (r) window.scrollTo({ top: window.scrollY + r.top + r.height / 2 - window.innerHeight * 0.45, behavior: reduce ? "auto" : "smooth" });
      return;
    }
    if (to === active) return;
    if (Math.abs(to - active) > 1) pos.jump(to - Math.sign(to - active));
    setActive(to);
    if (reduce) pos.jump(to);
    else animate(pos, to, { type: "spring", stiffness: 170, damping: 26 });
  };

  const current = story[active];

  return (
    <section className="border-y border-stone-200/70 bg-orange-50 py-16 lg:py-24" aria-labelledby="order-story-heading">
      <div className="container-page">
        <div className="mb-9 flex flex-col gap-5 lg:mb-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <RevealText id="order-story-heading" text={"From idea\nto doorstep."} className="max-w-[680px] font-serif text-[38px] leading-[1.08] tracking-[-0.025em] lg:text-[60px]" />
          <p className="max-w-[355px] text-[16px] leading-relaxed text-stone-600 lg:pb-1 lg:text-[18px]">You bring the idea, Mimi brings the hook. Here’s how a piece becomes yours.</p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
          {/* Desktop: the stage list (sage reference: a rail with an inset selected row) */}
          {/* The space under the button keeps the photo fully on screen while the last stage is centred. */}
          <div className="hidden lg:block lg:pb-[24vh]">
            <ol className="relative" aria-label="Order stages">
              <span className="absolute top-[18vh] bottom-[18vh] left-9 w-px bg-stone-200" aria-hidden />
              <motion.span className="absolute top-[18vh] bottom-[18vh] left-9 w-px origin-top bg-stone-900" style={{ scaleY: reduce ? active / last : rail }} aria-hidden />
              {story.map((s, i) => {
                const on = i === active;
                return (
                  <li key={s.title} ref={(el) => { rows.current[i] = el; }} className="flex min-h-[36vh] items-center">
                    <button
                      type="button"
                      onClick={() => go(i)}
                      aria-current={on ? "step" : undefined}
                      className={`relative flex w-full gap-5 rounded-[20px] px-5 py-6 text-left transition-opacity duration-200 ${on ? "opacity-100" : "opacity-45 hover:opacity-80"}`}
                    >
                      {on && <motion.span layoutId="story-selected" className="absolute inset-0 rounded-[20px] border border-stone-200 bg-white shadow-[0_12px_32px_-24px_rgb(28_25_23/0.3)]" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 36 }} />}
                      <span className={`relative mt-1 grid size-8 shrink-0 place-items-center rounded-full border text-[12px] font-semibold tabular-nums transition-colors duration-300 ${on ? "border-stone-900 bg-stone-900 text-orange-50" : "border-stone-300 bg-orange-50 text-stone-500"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="relative flex flex-col gap-2">
                        <span className={`text-[13px] font-semibold ${on ? "text-amber-800" : "text-stone-500"}`}>{stages[i].label}</span>
                        <span className="font-serif text-[26px] leading-tight">{s.title}</span>
                        <span className="max-w-[380px] text-[16px] leading-relaxed text-stone-600">{s.detail}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="pl-5">
              <ButtonLink href="/custom-order">Let’s make your piece</ButtonLink>
            </div>
          </div>

          {/* The photo, with the tag on top and Mimi's note over it */}
          <div className="lg:sticky lg:top-24">
            <div className="mb-4 flex justify-between gap-1.5 lg:hidden" role="group" aria-label="Choose an order stage">
              {stages.map((st, i) => (
                <button
                  key={st.key}
                  type="button"
                  aria-pressed={i === active}
                  aria-label={st.label}
                  onClick={() => go(i)}
                  className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[12px] border text-[11px] font-medium transition-colors ${
                    i === active ? "border-stone-900 bg-stone-900 text-orange-50" : "border-stone-200 bg-white text-stone-600"
                  }`}
                >
                  <span className="text-[13px] tabular-nums">{i + 1}</span>
                  {st.short}
                </button>
              ))}
            </div>

            <div className="mx-auto w-full rounded-[26px] border border-stone-200 bg-white p-2.5 shadow-[0_30px_70px_-40px_rgb(28_25_23/0.4)] lg:max-w-[min(100%,calc((100svh-210px)*0.75+20px))] lg:p-3">
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
                className="relative aspect-[3/4] w-full touch-pan-y overflow-hidden rounded-[18px] bg-stone-200"
                drag={desktop ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) go(active + 1);
                  else if (info.offset.x > 50) go(active - 1);
                }}
              >
                {story.map((s, i) => (
                  <Layer key={s.title} i={i} pos={pos} active={active} reduce={reduce} />
                ))}
                <Note active={active} />
              </motion.div>
            </div>

            <div className="mt-5 flex flex-col gap-3 lg:hidden" aria-live="polite">
              <h3 className="font-serif text-[23px] leading-tight">{current.title}</h3>
              <p className="text-[15px] leading-relaxed text-stone-600">{current.detail}</p>
              <p className="text-[13px] text-stone-500">Swipe the photo or tap a stage.</p>
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
