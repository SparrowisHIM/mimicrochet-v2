"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Chip } from "@/components/ui/chip";
import { ideaCategories, ideas, type IdeaCategory } from "@/lib/ideas";

export function IdeasSection() {
  const [cat, setCat] = useState<IdeaCategory | "all">("all");
  const list = cat === "all" ? ideas : ideas.filter((i) => i.category === cat);

  return (
    <section className="border-t border-stone-200/80 bg-white py-16 lg:py-24" aria-labelledby="ideas-title">
      <div className="container-page flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-[640px] flex-col gap-3">
          <h2 id="ideas-title" className="font-serif text-[32px] leading-[1.08] tracking-[-0.02em] lg:text-[48px]">
            Ideas to have made
          </h2>
          <p className="text-[16px] leading-[1.55] text-stone-600 lg:text-[18px]">
            Concept pictures to start from, including bags. Pick one and Mimi makes it in your size and colours. The price is agreed with
            her on WhatsApp.
          </p>
        </div>
      </div>

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto px-5 lg:container-page lg:mt-8">
        <Chip on={cat === "all"} onClick={() => setCat("all")}>
          All ideas
        </Chip>
        {ideaCategories.map((c) => (
          <Chip key={c} on={cat === c} onClick={() => setCat(cat === c ? "all" : c)}>
            {c}
          </Chip>
        ))}
      </div>

      <motion.ul layout className="container-page mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:mt-10 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-9">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((idea) => (
            <motion.li
              key={idea.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/custom-order?idea=${idea.slug}`} className="group flex flex-col gap-2.5">
                <span className="relative block aspect-[3/4] overflow-hidden rounded-[14px] bg-orange-100">
                  <Image
                    src={idea.image}
                    alt={`${idea.name}, a concept picture`}
                    fill
                    sizes="(min-width: 1024px) 250px, 45vw"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
                  />
                  <span className="absolute top-2 left-2 rounded-full bg-white/94 px-2.5 py-1 text-[12px] font-semibold text-stone-900 shadow-sm">
                    Idea
                  </span>
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] leading-snug font-medium">{idea.name}</span>
                  <span className="text-[13px] text-stone-500">
                    {idea.priceFrom ? `From ₦${idea.priceFrom.toLocaleString("en-NG")}` : "Price on request"}
                  </span>
                </span>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </section>
  );
}
