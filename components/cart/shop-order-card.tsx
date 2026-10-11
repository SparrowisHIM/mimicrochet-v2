"use client";

import { motion } from "motion/react";
import { CardStack } from "@/components/ui/card-stack";
import type { Order } from "@/lib/orders";
import { shopStages } from "@/lib/stages";

/** `test`: a checkout made while payments are off. It never moves on, so it shows "Test order" and no steps. */
export function ShopOrderCard({ order, test = false }: { order: Order; test?: boolean }) {
  const items = order.items ?? [];
  return (
    <div className="flex flex-col gap-4 rounded-[22px] border border-stone-200 bg-white p-5 shadow-[0_24px_48px_-12px_rgb(28_25_23/0.14)]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-stone-500">Order {order.id}</span>
        <span className={`rounded-full px-3 py-1.5 text-[13px] leading-none font-semibold ${test ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
          {test ? "Test order" : shopStages[order.stage]}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <CardStack images={items.map((it) => it.image)} size="md" />
        <span className="text-[15px] leading-snug font-medium">{items.map((i) => i.name + (i.size && i.size !== "One size" ? ` · ${i.size}` : "")).join(" and ")}</span>
      </div>
      {!test && (
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
      )}
    </div>
  );
}
