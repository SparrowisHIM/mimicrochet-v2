"use client";

import { motion } from "motion/react";
import type { Order } from "@/lib/orders";
import { shopStages } from "@/lib/stages";

export function ShopOrderCard({ order }: { order: Order }) {
  const items = order.items ?? [];
  return (
    <div className="flex flex-col gap-4 rounded-[22px] border border-stone-200 bg-white p-5 shadow-[0_24px_48px_-12px_rgb(28_25_23/0.14)]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-stone-500">Order {order.id}</span>
        <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[13px] leading-none font-semibold text-emerald-800">{shopStages[order.stage]}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex -space-x-4">
          {items.slice(0, 3).map((it) => (
            <span key={it.slug} className="relative h-[68px] w-[51px] overflow-hidden rounded-[10px] border-2 border-white bg-orange-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.image} alt="" className="size-full object-cover" />
            </span>
          ))}
        </span>
        <span className="text-[15px] leading-snug font-medium">{items.map((i) => i.name + (i.size && i.size !== "One size" ? ` · ${i.size}` : "")).join(" and ")}</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5" aria-hidden>
          {shopStages.map((s, i) => (
            <span key={s} className="relative h-1 flex-1 overflow-hidden rounded-full bg-stone-200">
              <motion.span className="absolute inset-0 origin-left bg-stone-900" initial={{ scaleX: 0 }} animate={{ scaleX: i <= order.stage ? 1 : 0 }} transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }} />
            </span>
          ))}
        </div>
        <div className="flex justify-between text-[12px] text-stone-500">
          {shopStages.map((s, i) => (
            <span key={s} className={i === order.stage ? "font-semibold text-stone-900" : ""}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
