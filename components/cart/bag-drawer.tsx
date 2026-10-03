"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { buttonClass } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { bagTotal, bagUi, useBagItems } from "@/lib/bag";
import { bagStore } from "@/lib/local-store";
import { formatNaira } from "@/lib/site";

export function BagDrawer() {
  const open = bagUi.useOpen();
  const items = useBagItems();
  const total = bagTotal(items);
  const added = bagUi.lastAdded();

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
            <Link href="/checkout" onClick={bagUi.close} className={buttonClass("primary", "md", "w-full")}>
              Checkout · {formatNaira(total)}
            </Link>
            <button type="button" onClick={bagUi.close} className="py-1 text-[15px] font-medium underline underline-offset-4">
              Keep shopping
            </button>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-4 py-6">
          <p className="text-[16px] text-stone-600">Your bag is empty. Every piece is one of one, so grab yours before it’s gone.</p>
          <Link href="/shop" onClick={bagUi.close} className={buttonClass("primary")}>
            Shop the collection
          </Link>
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
                  className={`relative flex gap-3.5 rounded-[18px] border bg-white p-3 transition-colors duration-700 ${fresh ? "border-emerald-300" : "border-stone-200"}`}
                >
                  {fresh && (
                    <motion.span
                      className="pointer-events-none absolute inset-0 rounded-[18px] bg-emerald-50"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 1.4, delay: 0.3 }}
                    />
                  )}
                  <Link href={`/shop/${p.slug}`} onClick={bagUi.close} className="relative h-[84px] w-[63px] shrink-0 overflow-hidden rounded-[10px] bg-orange-100">
                    <Image src={p.images[0]} alt="" fill sizes="63px" className="object-cover" />
                  </Link>
                  <div className="relative flex min-w-0 flex-1 flex-col">
                    {fresh && <span className="text-[12px] font-semibold text-emerald-800">Added to your bag</span>}
                    <span className="text-[15px] leading-snug font-medium">{p.name}</span>
                    <span className="text-[13px] text-stone-500">{p.size ? `Size ${p.size} · the only one` : p.leadTime ?? "Made to order"}</span>
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
