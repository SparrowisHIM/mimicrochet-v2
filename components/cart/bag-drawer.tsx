"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { stockFor } from "@/app/actions/orders";
import { ButtonChip, ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { bagTotal, bagUi, useBagItems } from "@/lib/bag";
import { bagStore } from "@/lib/local-store";
import { getProduct } from "@/lib/products";
import { formatNaira } from "@/lib/site";

export function BagDrawer() {
  const open = bagUi.useOpen();
  const items = useBagItems();
  const total = bagTotal(items);
  const added = bagUi.lastAdded();
  // Each time the bag opens, check its one-of-one pieces: one that sold since it was added comes out of
  // the bag, with one line saying so and a way to have one made.
  const [gone, setGone] = useState<string[]>([]);
  const readySlugs = items.filter((p) => p.kind === "ready").map((p) => p.slug).join(",");
  useEffect(() => {
    if (!open || !readySlugs) return;
    let live = true;
    stockFor(readySlugs.split(",")).then((r) => {
      if (!live || !r.sold.length) return;
      r.sold.forEach((slug) => bagStore.remove(slug));
      setGone((g) => [...g, ...r.sold.filter((slug) => !g.includes(slug))]);
    });
    return () => {
      live = false;
    };
  }, [open, readySlugs]);
  const goneNote = gone.length > 0 && (
    <div className="mb-3 flex flex-col gap-2 rounded-[14px] bg-amber-50 px-4 py-3 text-[14px] leading-[1.5] text-amber-900">
      {gone.map((slug) => (
        <p key={slug}>
          The {getProduct(slug)?.name ?? "piece"} found a home, so it’s out of your bag. Mimi can make you one.{" "}
          <Link href={`/custom-order?piece=${slug}`} onClick={bagUi.close} className="font-semibold underline underline-offset-2 hover:text-amber-950">
            Have it made
          </Link>
        </p>
      ))}
    </div>
  );

  return (
    <Sheet
      open={open}
      onClose={bagUi.close}
      title={items.length ? `Your bag (${items.length})` : "Your bag"}
      footer={
        items.length ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[16px] font-semibold">Subtotal</span>
              <span className="text-[16px] font-semibold">{formatNaira(total)}</span>
            </div>
            <p className="-mt-1.5 text-[13px] text-stone-500">Delivery is paid to the rider when it arrives.</p>
            <ButtonLink href="/checkout" onClick={bagUi.close} arrow={false} className="w-full">
              Checkout <ButtonChip>{formatNaira(total)}</ButtonChip>
            </ButtonLink>
            <button type="button" onClick={bagUi.close} className="py-1 text-[15px] font-medium underline underline-offset-4">
              Keep shopping
            </button>
          </div>
        ) : undefined
      }
    >
      {goneNote}
      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-4 py-6">
          <p className="text-[16px] text-stone-600">Your bag is empty. Pieces that are ready now exist once, so grab yours before it’s gone.</p>
          <ButtonLink href="/shop" onClick={bagUi.close}>
            Shop the collection
          </ButtonLink>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {items.map((p) => {
              const fresh = p.slug === added;
              return (
                <motion.li
                  key={p.slug}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                  className={`relative flex gap-3.5 rounded-[22px] border bg-white p-3 transition-colors duration-700 ${fresh ? "border-emerald-300" : "border-stone-200"}`}
                >
                  {fresh && (
                    <motion.span
                      className="pointer-events-none absolute inset-0 rounded-[22px] bg-emerald-50"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 1.4, delay: 0.3 }}
                    />
                  )}
                  <Link href={`/shop/${p.slug}`} onClick={bagUi.close} className="relative h-[84px] w-[63px] shrink-0 overflow-hidden rounded-[8px] bg-orange-100">
                    <Image src={p.images[0]} alt="" fill sizes="63px" className="object-cover" />
                  </Link>
                  <div className="relative flex min-w-0 flex-1 flex-col">
                    {fresh && <span className="text-[12px] font-semibold text-emerald-800">Added to your bag</span>}
                    <span className="text-[15px] leading-snug font-medium">{p.name}</span>
                    <span className="text-[13px] text-stone-500">{p.size ? `${p.size === "One size" ? "One size" : `Size ${p.size}`} · the only one` : p.leadTime ?? "Made for you"}</span>
                    <button type="button" onClick={() => bagStore.remove(p.slug)} className="mt-auto self-start pt-1 text-[13px] text-stone-600 underline underline-offset-2 hover:text-stone-900">
                      Remove
                    </button>
                  </div>
                  <span className="relative text-[15px] font-semibold">{formatNaira(p.price!)}</span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </Sheet>
  );
}
