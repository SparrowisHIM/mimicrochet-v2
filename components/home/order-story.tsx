"use client";

import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { RevealText } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { stages } from "@/lib/stages";

const story = [
  { photo: "/images/story/hero-ruby.jpg", alt: "The full Ruby crochet set laid flat beside red yarn", title: "Start with a little inspiration.", detail: "A saved photo, a colour you love, an idea you can't shake. Give Mimi a starting point.", caption: "The idea: a red set with a little movement." },
  { photo: "/images/story/ruby-yarn.jpg", alt: "The red yarn selected for the Ruby Dress", title: "Make a plan together.", detail: "Agree your measurements, price and timing on WhatsApp. Your 60% deposit gets things moving.", caption: "Colour chosen. Yarn ready for the first stitch." },
  { photo: "/images/story/ruby-in-progress.jpg", alt: "The Ruby skirt panel in progress, shown without cropping", title: "Watch your piece take shape.", detail: "Mimi shares the details as she works, so you can follow the making from your phone.", caption: "A work in progress, one row at a time." },
  { photo: "/images/products/red-fringe-beach-set-1.jpg", alt: "The complete Ruby Dress with its fringe visible", title: "Every last detail, finished.", detail: "See the finished piece, settle the remaining 40%, and agree delivery with Mimi.", caption: "The finished piece. Every fringe in place." },
  { photo: "/images/story/ruby-skirt-detail.jpg", alt: "The finished crochet and fringe of the Ruby skirt", title: "Now, make it your own.", detail: "Your handmade piece is on its way to your wardrobe. Delivery is arranged to your address.", caption: "The finishing details, ready for a new wardrobe." },
];
const ease = [0.22, 1, 0.36, 1] as const;

// Sage reference: a stable navigation rail with an inset selected row.
// Desktop stages follow normal scrolling; the photograph stays beside them.
function StageRow({ index, active, onSelect }: { index: number; active: number; onSelect: (index: number) => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { margin: "-32% 0px -42% 0px" });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (inView && !reduce && window.matchMedia("(min-width: 1024px)").matches) onSelect(index);
  }, [inView, index, onSelect, reduce]);
  const selected = active === index;
  return (
    <li ref={ref} className="relative py-2">
      <button type="button" onClick={() => onSelect(index)} aria-pressed={selected} aria-controls="order-story-media" className="relative flex min-h-[152px] w-full gap-5 rounded-[20px] px-5 py-6 text-left outline-offset-4">
        {selected && <motion.span layoutId="story-selected" className="absolute inset-0 rounded-[20px] border border-stone-200 bg-white shadow-[0_12px_32px_-24px_rgb(28_25_23/0.3)]" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34 }} />}
        <span className={`relative mt-1 grid size-8 shrink-0 place-items-center rounded-full border text-[12px] font-semibold tabular-nums transition-colors ${selected ? "border-stone-900 bg-stone-900 text-orange-50" : "border-stone-300 bg-orange-50 text-stone-500"}`}>{String(index + 1).padStart(2, "0")}</span>
        <span className="relative flex flex-col gap-2">
          <span className={`text-[13px] font-semibold ${selected ? "text-amber-800" : "text-stone-500"}`}>{stages[index].label}</span>
          <span className="font-serif text-[23px] leading-tight">{story[index].title}</span>
          <span className="max-w-[350px] text-[15px] leading-relaxed text-stone-600">{story[index].detail}</span>
        </span>
      </button>
    </li>
  );
}

export function OrderStory() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const current = story[active];
  return (
    <section className="overflow-clip border-y border-stone-200/70 bg-orange-50 py-16 lg:py-24" aria-labelledby="order-story-heading">
      <div className="container-page">
        <div className="mb-9 flex flex-col gap-5 lg:mb-14 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-4">
            <RevealText id="order-story-heading" text={"From idea\nto doorstep."} className="max-w-[680px] font-serif text-[38px] leading-[1.08] tracking-[-0.025em] lg:text-[60px]" />
          </div>
          <p className="max-w-[355px] text-[16px] leading-relaxed text-stone-600 lg:pb-1 lg:text-[18px]">You bring the idea, Mimi brings the hook. Here’s how a piece becomes yours.</p>
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
          <div className="hidden lg:block">
            <ol className="relative" aria-label="Explore the order stages">
              <span className="absolute top-12 bottom-12 left-9 w-px bg-stone-200" aria-hidden />
              {stages.map((stage, i) => <StageRow key={stage.key} index={i} active={active} onSelect={setActive} />)}
            </ol>
            <div className="mt-8 pl-5"><ButtonLink href="/custom-order">Let’s make your piece</ButtonLink></div>
          </div>
          <div className="lg:sticky lg:top-28">
            <div className="mb-5 flex justify-between gap-2 lg:hidden" role="group" aria-label="Choose an order stage">
              {stages.map((stage, i) => <button key={stage.key} type="button" aria-pressed={i === active} aria-controls="order-story-media" aria-label={stage.label} onClick={() => setActive(i)} className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[12px] border text-[11px] font-medium transition-colors ${i === active ? "border-stone-900 bg-stone-900 text-orange-50" : "border-stone-200 bg-white text-stone-600"}`}><span className="text-[13px] tabular-nums">0{i + 1}</span>{stage.short}</button>)}
            </div>
            <div id="order-story-media" className="rounded-[24px] border border-stone-200 bg-white p-3 shadow-[0_24px_64px_-40px_rgb(28_25_23/0.35)] lg:p-4">
              <div className="flex items-center justify-between px-1 pb-3 text-[13px] font-medium text-stone-500"><span className="font-semibold text-stone-900">The Ruby Dress</span><span className="tabular-nums">{active + 1} of {story.length}</span></div>
              <div className="relative aspect-[4/5] w-full max-h-[58svh] overflow-hidden rounded-[15px] bg-stone-100">
                <AnimatePresence initial={false}>
                  <motion.div key={active} className="absolute inset-0" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0.1 : 0.55, ease }}>
                    <Image src={current.photo} alt={current.alt} fill sizes="(min-width: 1440px) 540px, (min-width: 1024px) 42vw, 90vw" className="object-contain" />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex items-start gap-3 px-2 pt-4 pb-2" aria-live="polite">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-orange-100 font-serif text-amber-900" aria-hidden>M</span>
                <div className="min-h-[62px] flex-1"><p className="text-[12px] font-semibold text-stone-500">{stages[active].label}</p><AnimatePresence mode="wait" initial={false}><motion.p key={active} initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-1 text-[15px] leading-snug">{current.caption}</motion.p></AnimatePresence></div>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 lg:hidden"><h3 className="font-serif text-[23px] leading-tight">{current.title}</h3><p className="text-[15px] leading-relaxed text-stone-600">{current.detail}</p><div className="pt-2"><ButtonLink href="/custom-order">Let’s make your piece</ButtonLink></div></div>
            <p className="mt-4 text-center text-[12px] text-stone-500">Five stages. A timeline agreed with you.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
