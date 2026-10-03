"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import type { Product } from "@/lib/products";

export function FreshOffTheHook({ pieces }: { pieces: Product[] }) {
  const [readyOnly, setReadyOnly] = useState(false);
  const shown = (readyOnly ? pieces.filter((p) => p.kind === "ready") : pieces).slice(0, 8);

  return (
    <section className="container-page flex flex-col gap-6 py-16 lg:gap-10 lg:py-24">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="font-serif text-[32px] leading-[1.08] tracking-[-0.02em] lg:text-[48px]">Fresh off the hook</h2>
        <Toggle id="home-ready-only" label="Ready to wear only" checked={readyOnly} onChange={setReadyOnly} />
      </div>

      <motion.ul layout className="grid grid-cols-2 gap-x-3 gap-y-7 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-11">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((p, i) => (
            <motion.li
              key={p.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={i >= 6 ? "max-lg:hidden" : ""}
            >
              <ProductCard product={p} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <div className="flex justify-center pt-2">
        <ButtonLink href={readyOnly ? "/shop?type=ready" : "/shop"} variant="secondary" className="max-sm:w-full">
          View more pieces
        </ButtonLink>
      </div>
    </section>
  );
}
