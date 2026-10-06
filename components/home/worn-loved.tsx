"use client";

import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CustomerStory } from "@/components/customers/customer-story";
import { RevealText } from "@/components/motion/reveal";
import type { Customer } from "@/lib/customers";

const SLIDE_MS = 4800;
const subscribeVisibility = (notify: () => void) => {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
};
const pageVisible = () => document.visibilityState === "visible";
const serverVisible = () => false;

function CustomerPreview({ customer, open, onOpen }: { customer: Customer; open: boolean; onOpen: () => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { amount: 0.45 });
  const reduce = useReducedMotion();
  const visible = useSyncExternalStore(subscribeVisibility, pageVisible, serverVisible);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loaded, setLoaded] = useState("");
  const count = customer.photos.length;
  const photo = customer.photos[index];
  const playing = count > 1 && inView && visible && !reduce && !paused && !hovered && !focused && !open && loaded === photo.src;

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [playing, index, count]);
  const move = (direction: number) => {
    setPaused(true);
    setIndex((i) => (i + direction + count) % count);
  };
  return (
    <li ref={ref} className="w-[76vw] max-w-[320px] shrink-0 snap-start lg:w-auto lg:max-w-none"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false); }}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-orange-100">
        <button type="button" onClick={onOpen} className="absolute inset-0 size-full text-left" aria-label={`Open ${customer.name}’s photos`}>
          <AnimatePresence initial={false}>
            <motion.span key={photo.src} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.65 }}>
              <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 416px, 76vw" className="object-cover" onLoad={() => setLoaded(photo.src)} />
            </motion.span>
          </AnimatePresence>
        </button>
        {inView && count > 1 && <Image src={customer.photos[(index + 1) % count].src} alt="" aria-hidden fill loading="eager" sizes="(min-width: 1024px) 416px, 76vw" className="pointer-events-none invisible object-cover" />}
        {count > 1 && <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-x-3 top-3 flex gap-1" aria-hidden>
            {customer.photos.map((p, i) => <span key={p.src} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
              <span key={i === index ? String(playing) : "static"} className="block size-full origin-left bg-white"
                style={{ transform: `scaleX(${i < index ? 1 : 0})`, animation: i === index && playing ? `customer-photo-progress ${SLIDE_MS}ms linear forwards` : undefined }} />
            </span>)}
          </div>
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
            <span className="rounded-full bg-stone-950/75 px-3 py-2 text-[12px] font-medium text-white tabular-nums" aria-label={`Photo ${index + 1} of ${count}`}>{index + 1} / {count}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => move(-1)} aria-label={`Previous photo of ${customer.name}`} className="grid size-10 place-items-center rounded-full bg-stone-950/75 text-white hover:bg-stone-950">←</button>
              {!reduce && <button type="button" onClick={() => setPaused((p) => !p)} aria-label={`${paused ? "Play" : "Pause"} ${customer.name}’s slideshow`} className="grid size-10 place-items-center rounded-full bg-stone-950/75 text-white hover:bg-stone-950">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>{paused ? <path d="M4 2 14 8 4 14Z" /> : <><rect x="3" y="2" width="3" height="12" rx="1" /><rect x="10" y="2" width="3" height="12" rx="1" /></>}</svg>
              </button>}
              <button type="button" onClick={() => move(1)} aria-label={`Next photo of ${customer.name}`} className="grid size-10 place-items-center rounded-full bg-stone-950/75 text-white hover:bg-stone-950">→</button>
            </div>
          </div>
        </>}
      </div>
      <button type="button" onClick={onOpen} className="mt-4 flex w-full flex-col gap-3 text-left lg:mt-[18px]" aria-label={`Read ${customer.name}’s story`}>
        <span className="font-serif text-[19px] leading-[1.35] lg:text-[21px]">“{customer.quote}”</span>
        <span className="text-[13px] font-medium text-stone-500 lg:text-[14px]">{customer.name}, {customer.city}</span>
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
      <ul className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 lg:container-page lg:mt-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible">
        {customers.map((customer) => <CustomerPreview key={customer.slug} customer={customer} open={open !== null} onOpen={() => setOpen(customer.slug)} />)}
      </ul>
      <CustomerStory customers={customers} openSlug={open} onClose={() => setOpen(null)} onChange={setOpen} />
    </section>
  );
}
