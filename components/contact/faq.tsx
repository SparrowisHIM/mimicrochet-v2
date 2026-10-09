"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const faqs = [
  { q: "Do you deliver to my state?", a: "Yes, anywhere in Nigeria. You pay the rider for delivery when your order arrives." },
  { q: "How do custom orders work?", a: "Send your idea, agree the price and date with Mimi on WhatsApp, then pay a 60% deposit and she starts. The other 40% is paid when it’s ready, or you can pay the full price up front. You follow every step with your own tracking link." },
  { q: "How long does a custom piece take?", a: "Usually about three weeks, depending on the piece and size. Shirts take about five days and earrings about three. Need it sooner? That’s a rush order, and rush work costs extra (about ₦20–30k)." },
  { q: "How do I pick my size?", a: "Choose XS to XL from the size guide, or add your own measurements. Mimi makes it to what you give her, so check them before you send." },
  { q: "Can I return something?", a: "If your piece isn’t what you agreed, or something’s wrong with the work, Mimi will make it right. Pieces made to measurements you gave can’t be remade for free if the measurements were wrong." },
  { q: "How do I pay?", a: "Pieces that are ready now are paid online with Paystack. Custom orders, the deposit or the full price, are paid by bank transfer to the account Mimi sends you on WhatsApp." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="border-b border-stone-200">
      {faqs.map((f, i) => {
        const on = open === i;
        return (
          <li key={f.q} className="border-t border-stone-200">
            <button type="button" aria-expanded={on} onClick={() => setOpen(on ? null : i)} className="group flex w-full items-center justify-between gap-6 py-5 text-left text-[17px] font-medium transition-colors duration-200 hover:text-stone-600 lg:text-[18px]">
              {f.q}
              <span className="relative size-4 shrink-0 transition-transform duration-300 ease-out group-hover:rotate-45" aria-hidden>
                <span className="absolute top-1/2 left-0 h-[1.5px] w-4 -translate-y-1/2 bg-stone-900" />
                <motion.span className="absolute top-1/2 left-0 h-[1.5px] w-4 -translate-y-1/2 bg-stone-900" animate={{ rotate: on ? 0 : 90 }} transition={{ duration: 0.3 }} />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {on && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                  <p className="max-w-[640px] pb-5 text-[16px] leading-[1.55] text-stone-600">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
