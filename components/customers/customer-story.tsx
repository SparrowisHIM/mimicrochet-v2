"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronIcon, CloseIcon } from "@/components/icons";
import { ButtonLink, linkClass } from "@/components/ui/button";
import type { Customer } from "@/lib/customers";

const ease = [0.22, 1, 0.36, 1] as const;

function Name({ text }: { text: string }) {
  const reduce = useReducedMotion();
  return (
    <span aria-label={text} className="block">
      {text.split("").map((ch, i) => (
        <motion.span
          key={`${text}-${i}`}
          aria-hidden
          className="inline-block"
          initial={reduce ? false : { y: "0.6em", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease, delay: 0.15 + i * 0.045 }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

function Story({ customer, next, instant, onNext, onClose }: { customer: Customer; next: Customer; instant: boolean; onNext: () => void; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const count = customer.photos.length;
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const strip = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const photo = customer.photos[index];
  const nextPhoto = customer.photos[(index + 1) % count];
  const caption = photo.caption ?? customer.photos.find((p) => p.caption)?.caption;
  const primary = customer.wearing.find((w) => w.href);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, onClose]);

  // Phone: keep the counter in sync with the native swipe strip.
  const onScroll = () => {
    const el = strip.current;
    if (!el) return;
    const w = el.firstElementChild?.getBoundingClientRect().width ?? 1;
    const i = Math.round(el.scrollLeft / (w + 12));
    if (i !== index) setIndex(Math.min(count - 1, Math.max(0, i)));
  };

  const actions = (
    <div className="flex items-center gap-5">
      {primary ? (
        <ButtonLink href={primary.href!} className="min-w-0 flex-1 px-4 lg:flex-none lg:px-7">
          Shop this piece
        </ButtonLink>
      ) : (
        <ButtonLink href="/custom-order" className="min-w-0 flex-1 px-4 lg:flex-none lg:px-7">
          Have yours made
        </ButtonLink>
      )}
      <Link href="/shop" className={`${linkClass} px-2`}>
        Browse the shop
      </Link>
    </div>
  );

  const wearing = (
    <div className="flex flex-col gap-3">
      <span className="text-[14px] font-medium text-stone-500">Wearing</span>
      <ul className="flex gap-4 max-lg:overflow-x-auto lg:flex-col lg:gap-3">
        {customer.wearing.map((w) => (
          <li key={w.name} className="flex shrink-0 items-center gap-3">
            <span className="relative block h-[60px] w-12 overflow-hidden rounded-[8px] bg-orange-100 max-lg:h-[45px] max-lg:w-9">
              <Image src={w.image} alt="" fill sizes="48px" className="object-cover" />
            </span>
            <span className="flex flex-col">
              <span className="text-[15px] font-semibold">{w.name}</span>
              <span className="text-[13px] text-stone-500 lg:text-[14px]">{w.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${customer.name}, ${customer.city}`}
      className="fixed inset-0 z-50 flex flex-col overflow-x-hidden overflow-y-auto bg-orange-50"
      initial={{ opacity: instant ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container-page flex items-center justify-between py-4 lg:py-8">
        <span className="font-serif text-[17px] lg:text-[20px]">Worn, loved, re-worn</span>
        <button ref={closeRef} type="button" onClick={onClose} className="flex items-center gap-2 rounded-full p-1.5 text-[15px] font-medium hover:bg-orange-100" aria-label="Close">
          <span className="max-lg:hidden">Close</span>
          <CloseIcon size={20} />
        </button>
      </div>

      {/* Desktop: feature column + gallery */}
      <div className="container-page hidden flex-1 items-center gap-12 pb-10 lg:flex">
        <div className="flex w-[440px] shrink-0 flex-col">
          <h2 className="font-serif text-[120px] leading-[0.95] tracking-[-0.02em]">
            <Name text={customer.name} />
          </h2>
          <p className="mt-3.5 text-[18px] text-stone-600">{customer.city}</p>
          <p className="mt-10 font-serif text-[34px] leading-[1.22]">“{customer.quote}”</p>
          <div className="mt-8">{wearing}</div>
          <div className="mt-9">{actions}</div>
          {count > 1 && (
            <div className="mt-11 flex gap-2" role="tablist" aria-label="Photos">
              {customer.photos.map((p, i) => (
                <button
                  key={p.src}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Photo ${i + 1} of ${count}`}
                  onClick={() => go(i)}
                  className={`relative h-[65px] w-[52px] overflow-hidden rounded-[6px] transition-[opacity,box-shadow] ${
                    i === index ? "opacity-100 ring-2 ring-stone-900 ring-offset-2 ring-offset-orange-50" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={p.src} alt="" fill sizes="52px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex min-w-0 flex-1 gap-6 self-stretch">
          <div className="flex w-[min(500px,46vw)] shrink-0 flex-col">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-orange-100">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={photo.src}
                  className="absolute inset-0"
                  initial={{ opacity: 0, x: 40, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -40, scale: 0.98 }}
                  transition={{ duration: 0.45, ease }}
                >
                  <Image src={photo.src} alt={photo.alt} fill sizes="500px" className="object-cover" preload />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-4 flex items-start justify-between gap-6">
              <p className="max-w-[320px] text-[14px] leading-[1.45] text-stone-500">{caption}</p>
              {count > 1 && (
                <div className="flex items-center gap-2.5">
                  <button type="button" onClick={() => go(index - 1)} className="grid size-10 place-items-center rounded-full border border-stone-300 hover:bg-orange-100" aria-label="Previous photo">
                    <ChevronIcon direction="left" size={18} />
                  </button>
                  <span className="min-w-10 text-center text-[14px] font-medium tabular-nums">
                    {index + 1} / {count}
                  </span>
                  <button type="button" onClick={() => go(index + 1)} className="grid size-10 place-items-center rounded-full border border-stone-300 hover:bg-orange-100" aria-label="Next photo">
                    <ChevronIcon direction="right" size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="relative -mr-16 flex min-w-0 flex-1 flex-col justify-between pt-[12%]">
            {count > 1 && (
              <button type="button" onClick={() => go(index + 1)} className="relative aspect-[4/5] w-[400px] overflow-hidden rounded-[16px] opacity-90 transition-opacity hover:opacity-100" aria-label="Next photo">
                <Image src={nextPhoto.src} alt="" fill sizes="400px" className="object-cover" />
              </button>
            )}
            <button type="button" onClick={onNext} className="group flex items-center gap-3 self-start pb-1 text-left">
              <span className="relative h-[55px] w-11 overflow-hidden rounded-[6px]">
                <Image src={next.photos[0].src} alt="" fill sizes="44px" className="object-cover" />
              </span>
              <span className="flex flex-col">
                <span className="text-[13px] text-stone-500">Next story</span>
                <span className="text-[15px] font-semibold">
                  {next.name}, {next.city}
                </span>
              </span>
              <ChevronIcon size={20} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Phone: swipe gallery, then the words */}
      <div className="flex flex-1 flex-col lg:hidden">
        <div ref={strip} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5">
          {customer.photos.map((p) => (
            <div key={p.src} className="relative aspect-[4/5] w-[78vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[16px] bg-orange-100">
              <Image src={p.src} alt={p.alt} fill sizes="78vw" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 px-5 pt-3 text-[13px] leading-[1.45] text-stone-500">
          {count > 1 && (
            <span className="font-semibold whitespace-nowrap text-stone-900 tabular-nums">
              {index + 1} / {count}
            </span>
          )}
          <span>{caption}</span>
        </div>
        <div className="flex flex-col px-5 pt-6 pb-6">
          <h2 className="font-serif text-[56px] leading-none tracking-[-0.02em]">
            <Name text={customer.name} />
          </h2>
          <p className="mt-2 text-[15px] text-stone-600">{customer.city}</p>
          <p className="mt-5 font-serif text-[24px] leading-[1.25]">“{customer.quote}”</p>
          <div className="mt-6">{wearing}</div>
          <button type="button" onClick={onNext} className="mt-6 flex items-center gap-2 self-start text-[14px] font-semibold">
            Next story: {next.name} <ChevronIcon size={18} />
          </button>
        </div>
        <div className="sticky bottom-0 mt-auto bg-orange-50/95 px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] backdrop-blur">{actions}</div>
      </div>
    </motion.div>
  );
}

export function CustomerStory({
  customers,
  openSlug,
  onClose,
  onChange,
}: {
  customers: Customer[];
  openSlug: string | null;
  onClose: () => void;
  onChange: (slug: string) => void;
}) {
  const i = customers.findIndex((c) => c.slug === openSlug);
  const customer = i >= 0 ? customers[i] : null;
  const next = customers[(i + 1) % customers.length];
  // "Next story" swaps one open story for another: the new one appears at once on top, instead of
  // both fading together and letting the page show through for a moment.
  const [shownSlug, setShownSlug] = useState(openSlug);
  const [swapping, setSwapping] = useState(false);
  if (shownSlug !== openSlug) {
    setSwapping(shownSlug !== null && openSlug !== null);
    setShownSlug(openSlug);
  }

  useEffect(() => {
    if (!customer) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [customer]);

  return (
    <AnimatePresence>
      {customer && <Story key={customer.slug} customer={customer} next={next} instant={swapping} onNext={() => onChange(next.slug)} onClose={onClose} />}
    </AnimatePresence>
  );
}
