"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Chip } from "@/components/ui/chip";
import { Hairline } from "@/components/ui/hairline";
import { ideaCategories, ideas, type IdeaCategory } from "@/lib/ideas";
import { useMedia } from "@/lib/use-media";

// Three rows to start (6 ideas on phones, 9 on small tablets, 15 on desktop), so the section doesn't
// turn into a long scroll. Each "Show more" adds three more rows, which rise in one after another.
const ROWS = 3;

export function IdeasSection() {
  const reduce = useReducedMotion();
  const [cat, setCat] = useState<IdeaCategory | "all">("all");
  const [rows, setRows] = useState(ROWS);
  // Where the newest rows start, so only they get the staggered rise.
  const [from, setFrom] = useState(Infinity);
  const desktop = useMedia("(min-width: 1024px)");
  const tablet = useMedia("(min-width: 640px)");
  const cols = desktop ? 5 : tablet ? 3 : 2;
  const list = cat === "all" ? ideas : ideas.filter((i) => i.category === cat);
  const shown = list.slice(0, rows * cols);
  const pick = (c: IdeaCategory | "all") => {
    setCat(c);
    setRows(ROWS);
    setFrom(Infinity);
  };

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
        <Chip on={cat === "all"} onClick={() => pick("all")}>
          All ideas
        </Chip>
        {ideaCategories.map((c) => (
          <Chip key={c} on={cat === c} onClick={() => pick(cat === c ? "all" : c)}>
            {c}
          </Chip>
        ))}
      </div>

      <motion.ul layout className="container-page mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:mt-10 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-9">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((idea, i) => (
            <motion.li
              key={idea.slug}
              layout
              initial={reduce ? { opacity: 0 } : i >= from ? { opacity: 0, y: 18 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: i >= from ? 0.45 : 0.3, ease: [0.22, 1, 0.36, 1], delay: i >= from && !reduce ? Math.min(i - from, 14) * 0.035 : 0 }}
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
      {shown.length < list.length && (
        <div className="container-page mt-8 lg:mt-10">
          <Hairline
            label="Show more"
            onClick={() => {
              setFrom(shown.length);
              setRows((r) => r + ROWS);
            }}
          />
        </div>
      )}
    </section>
  );
}
