"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { ArrowUpRightIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { CardStack } from "@/components/ui/card-stack";
import { Chip } from "@/components/ui/chip";
import { Hairline } from "@/components/ui/hairline";
import { Sheet } from "@/components/ui/sheet";
import { ideas, occasions, pinterestSearch, type Idea } from "@/lib/ideas";
import { site } from "@/lib/site";

export function IdeasSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (idea: Idea) => void }) {
  const [occasion, setOccasion] = useState<(typeof occasions)[number] | "All">("All");
  const [picked, setPicked] = useState<Idea | null>(null);
  const [words, setWords] = useState("ruffle set beach");
  const list = occasion === "All" ? ideas : ideas.filter((i) => i.occasion.includes(occasion));
  // Two rows to start; each "Show more" adds two more rows.
  const ROWS = 6;
  const [shown, setShown] = useState(ROWS);
  const reduce = useReducedMotion();

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="bottom"
      title="Ideas"
      footer={
        <Button className="w-full" disabled={!picked} onClick={() => picked && onPick(picked)}>
          {picked ? `Use “${picked.name}”` : "Pick an idea"}
        </Button>
      }
    >
      <p className="text-[15px] text-stone-600">Concepts Mimi can make for you. Pick one to start.</p>
      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
        {(["All", ...occasions] as const).map((o) => (
          <Chip
            key={o}
            on={occasion === o}
            onClick={() => {
              setOccasion(o);
              setShown(ROWS);
            }}
          >
            {o}
          </Chip>
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2.5">
        {list.slice(0, shown).map((idea, i) => {
          const on = picked?.slug === idea.slug;
          // Rows added by "Show more" rise in, one after another.
          const fresh = i >= ROWS && !reduce;
          return (
            <motion.li
              key={idea.slug}
              initial={fresh ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: fresh ? ((i % ROWS) * 0.04) : 0 }}
            >
              <button type="button" onClick={() => setPicked(on ? null : idea)} aria-pressed={on} className="flex w-full flex-col gap-1.5 text-left">
                <span className={`relative block aspect-[3/4] overflow-hidden rounded-[12px] bg-orange-100 transition-shadow ${on ? "ring-[2.5px] ring-stone-900 ring-offset-2 ring-offset-orange-50" : ""}`}>
                  <Image src={idea.image} alt={idea.name} fill sizes="120px" className="object-cover" />
                </span>
                <span className="text-[13px] leading-tight font-medium">{idea.name}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>
      {shown < list.length && <Hairline label="Show more" onClick={() => setShown((n) => n + ROWS)} className="mt-4" />}

      <div className="mt-6 flex flex-col gap-2.5 rounded-[18px] bg-white p-4">
        <p className="text-[15px] font-semibold">More ideas on Pinterest</p>
        <a href={site.socials.pinterest} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-[14px] border border-stone-200 p-2.5 pr-3.5 transition-colors duration-150 hover:border-stone-900">
          <CardStack images={["/images/products/lilac-ruffle-tube-dress-1.jpg", "/images/products/red-fringe-beach-set-1.jpg", "/images/products/blossin-loom-earrings-1.jpg"]} />
          <span className="flex flex-1 flex-col">
            <span className="text-[15px] font-semibold">Mimi’s Pinterest</span>
            <span className="text-[13px] text-stone-500">57 pins of her own crochet work</span>
          </span>
          <ArrowUpRightIcon size={18} />
        </a>
        <p className="pt-1 text-[13px] font-medium text-stone-500">Or search crochet ideas</p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            window.open(pinterestSearch(words), "_blank", "noopener");
          }}
        >
          <label className="flex h-11 flex-1 items-center rounded-full bg-orange-50 px-4">
            <span className="sr-only">Search words</span>
            <span className="text-[15px] text-stone-400">crochet&nbsp;</span>
            <input value={words} onChange={(e) => setWords(e.target.value)} className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
          </label>
          <Button type="submit" variant="secondary" size="sm" className="h-11 px-4">
            Search
          </Button>
        </form>
        <p className="text-[13px] text-stone-500">Save a pin you love, then add it as a photo.</p>
      </div>
    </Sheet>
  );
}
