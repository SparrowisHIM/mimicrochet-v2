"use client";

import Image from "next/image";
import { useState } from "react";
import { CustomerStory } from "@/components/customers/customer-story";
import type { Customer } from "@/lib/customers";

function StoryBars({ count }: { count: number }) {
  return (
    <span className="pointer-events-none absolute inset-x-3 top-3 flex gap-1 lg:inset-x-4 lg:top-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`h-[3px] flex-1 rounded-full ${i === 0 ? "bg-white" : "bg-white/40"}`} />
      ))}
    </span>
  );
}

export function WornLoved({ customers }: { customers: Customer[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="py-16 lg:py-28" aria-labelledby="worn-title">
      <div className="container-page flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <h2 id="worn-title" className="font-serif text-[32px] leading-[1.08] tracking-[-0.02em] lg:text-[48px]">
          Worn, loved, re-worn
        </h2>
        <p className="text-[16px] leading-[1.5] text-stone-600 lg:text-[17px]">Photos from the people who wear them.</p>
      </div>

      <ul className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 lg:container-page lg:mt-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible">
        {customers.map((c) => (
          <li key={c.slug} className="w-[76vw] max-w-[320px] shrink-0 snap-start lg:w-auto lg:max-w-none">
            <button
              type="button"
              onClick={() => setOpen(c.slug)}
              className="group flex w-full flex-col gap-4 text-left lg:gap-[18px]"
              aria-label={`Open ${c.name}’s photos`}
            >
              <span className="relative block aspect-[4/5] w-full overflow-hidden rounded-[18px] bg-orange-100">
                <Image
                  src={c.photos[0].src}
                  alt={c.photos[0].alt}
                  fill
                  sizes="(min-width: 1024px) 416px, 76vw"
                  className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
                />
                {c.photos.length > 1 && <StoryBars count={c.photos.length} />}
              </span>
              <span className="font-serif text-[19px] leading-[1.35] lg:text-[21px]">“{c.quote}”</span>
              <span className="text-[13px] font-medium text-stone-500 lg:text-[14px]">
                {c.name}, {c.city}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <CustomerStory customers={customers} openSlug={open} onClose={() => setOpen(null)} onChange={setOpen} />
    </section>
  );
}
