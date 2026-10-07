"use client";

import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CustomerStory } from "@/components/customers/customer-story";
import { RevealText } from "@/components/motion/reveal";
import type { Customer } from "@/lib/customers";

// Still photos don't need long: 2s each when there are several, a little longer when there are only two.
const slideMs = (count: number) => (count >= 4 ? 2000 : count === 3 ? 2600 : 3400);
const subscribeVisibility = (notify: () => void) => {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
};
const pageVisible = () => document.visibilityState === "visible";
const serverVisible = () => false;

function CustomerPreview({ customer, open, onOpen }: { customer: Customer; open: boolean; onOpen: () => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const visible = useSyncExternalStore(subscribeVisibility, pageVisible, serverVisible);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const count = customer.photos.length;
  const photo = customer.photos[index];
  // It plays by itself; the bars on top show where it is. A real mouse hover or keyboard focus pauses it
  // (phones count a tap as a hover and leave focus behind), and it stops off screen and for reduced motion.
  const playing = count > 1 && inView && visible && !reduce && !hovered && !focused && !open;

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), slideMs(count));
    return () => clearTimeout(timer);
  }, [playing, index, count]);
  return (
    <li ref={ref} className="w-[76vw] max-w-[320px] shrink-0 snap-start lg:w-auto lg:max-w-none"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)} onPointerLeave={() => setHovered(false)}
      onFocusCapture={(e) => (e.target as Element).matches(":focus-visible") && setFocused(true)} onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false); }}>
      <div className="group/photo relative aspect-[4/5] overflow-hidden rounded-[18px] bg-orange-100">
        <button type="button" onClick={onOpen} className="absolute inset-0 size-full text-left transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/photo:scale-[1.03] motion-reduce:group-hover/photo:scale-100" aria-label={`Open ${customer.name}’s photos`}>
          <AnimatePresence initial={false}>
            <motion.span key={photo.src} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.45 }}>
              <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 416px, 76vw" className="object-cover" />
            </motion.span>
          </AnimatePresence>
        </button>
        {inView && count > 1 && <Image src={customer.photos[(index + 1) % count].src} alt="" aria-hidden fill loading="eager" sizes="(min-width: 1024px) 416px, 76vw" className="pointer-events-none invisible object-cover" />}
        {count > 1 && <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-x-3 top-3 flex gap-1" aria-hidden>
            {customer.photos.map((p, i) => <span key={p.src} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
              <span key={i === index ? String(playing) : "static"} className="block size-full origin-left bg-white"
                style={{ transform: `scaleX(${i < index ? 1 : 0})`, animation: i === index && playing ? `customer-photo-progress ${slideMs(count)}ms linear forwards` : undefined }} />
            </span>)}
          </div>
        </>}
      </div>
      <button type="button" onClick={onOpen} className="group/quote mt-4 flex w-full flex-col gap-3 text-left lg:mt-[18px]" aria-label={`Read ${customer.name}’s story`}>
        <span className="font-serif text-[19px] leading-[1.35] lg:text-[21px]">“{customer.quote}”</span>
        <span className="text-[13px] font-medium text-stone-500 underline decoration-transparent decoration-[1.5px] underline-offset-4 transition-[text-decoration-color,color] duration-200 group-hover/quote:text-stone-900 group-hover/quote:decoration-stone-900/40 lg:text-[14px]">{customer.name}, {customer.city}</span>
      </button>
    </li>
  );
}

export function WornLoved({ customers }: { customers: Customer[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="py-16 lg:py-28" aria-labelledby="worn-title">
      <div className="container-page flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <RevealText id="worn-title" text="Worn, loved, re-worn" className="font-serif text-[32px] leading-[1.08] tracking-[-0.02em] lg:text-[48px]" />
        <p className="text-[16px] leading-[1.5] text-stone-600 lg:text-[17px]">Photos from the people who wear them.</p>
      </div>
      <ul className="no-scrollbar mt-8 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 lg:container-page lg:mt-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible">
        {customers.map((customer) => <CustomerPreview key={customer.slug} customer={customer} open={open !== null} onOpen={() => setOpen(customer.slug)} />)}
      </ul>
      <CustomerStory customers={customers} openSlug={open} onClose={() => setOpen(null)} onChange={setOpen} />
    </section>
  );
}
