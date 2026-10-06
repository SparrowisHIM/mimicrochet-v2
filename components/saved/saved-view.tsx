"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { HeartIcon, WhatsAppIcon } from "@/components/icons";
import { SaveButton } from "@/components/product/save-button";
import { Button, buttonClass } from "@/components/ui/button";
import { RevealText } from "@/components/motion/reveal";
import { addToBag } from "@/lib/bag";
import { bagStore, savedStore } from "@/lib/local-store";
import { getProduct, priceLabel, type Product } from "@/lib/products";
import { whatsappLink } from "@/lib/site";

type Row = { p: Product; status: "available" | "made" | "sold"; line: string };

function rowFor(p: Product): Row {
  if (p.kind === "ready" && p.sold) return { p, status: "sold", line: "Sold. Mimi can make it for you." };
  if (p.kind === "ready") return { p, status: "available", line: p.size === "One size" ? "Still available" : `Still available in ${p.size}` };
  return { p, status: "made", line: p.leadTime ?? "Made for you" };
}

export function SavedView() {
  const slugs = savedStore.useList();
  const bag = bagStore.useList();
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);
  const rows = slugs.map((s) => getProduct(s)).filter((p): p is Product => Boolean(p)).map(rowFor);
  const origin = hydrated ? window.location.origin : "";
  const message = `Hi Mimi! These are the pieces I saved:\n${rows.map((r) => `• ${r.p.name} (${priceLabel(r.p)}) ${origin}/shop/${r.p.slug}`).join("\n")}\nCan you tell me more?`;

  const action = (r: Row, wide = false) => {
    const cls = wide ? "w-full" : "";
    if (r.status === "sold" || r.p.checkout === "request")
      return (
        <Link href={`/custom-order?piece=${r.p.slug}`} className={buttonClass("secondary", "sm", cls)}>
          Have it made
        </Link>
      );
    const inBag = bag.includes(r.p.slug);
    return (
      <Button size="sm" variant={inBag ? "secondary" : "primary"} className={cls} onClick={() => addToBag(r.p.slug)}>
        {inBag ? "In your bag" : "Add to bag"}
      </Button>
    );
  };

  const tone = (r: Row) => (r.status === "available" ? "text-emerald-800" : "text-amber-800");
  const dot = (r: Row) => (r.status === "available" ? "bg-emerald-500" : "bg-amber-500");

  return (
    <div className="pb-20 lg:pb-28">
      <div className="container-page flex flex-col gap-4 pt-6 pb-6 lg:flex-row lg:items-end lg:justify-between lg:pt-14 lg:pb-10">
        <div className="flex flex-col gap-2">
          <RevealText as="h1" immediate text="Saved" className="font-serif text-[40px] leading-none tracking-[-0.02em] lg:text-[64px]" />
          <p className="text-[15px] text-stone-600 lg:text-[17px]">
            {rows.length ? `${rows.length} ${rows.length === 1 ? "piece" : "pieces"}, kept on this device. No account needed.` : "Kept on this device. No account needed."}
          </p>
        </div>
        {rows.length > 0 && (
          <div className="hidden lg:block">
            <a href={whatsappLink(message)} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
              Send my list to Mimi
            </a>
          </div>
        )}
      </div>

      {hydrated && rows.length === 0 && (
        <div className="container-page">
          <div className="flex flex-col items-start gap-4 rounded-[22px] bg-white p-8 lg:p-12">
            <span className="grid size-12 place-items-center rounded-full bg-orange-100 text-red-600">
              <HeartIcon filled />
            </span>
            <p className="font-serif text-[28px] leading-tight">Nothing saved yet</p>
            <p className="max-w-[440px] text-[16px] text-stone-600">Tap the heart on any piece to keep it here. Every piece is one of one, so if one sells, Mimi can still make it for you.</p>
            <Link href="/shop" className={buttonClass("primary")}>
              Browse the shop
            </Link>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <>
          {/* Phone: list */}
          <ul className="container-page flex flex-col lg:hidden">
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <motion.li key={r.p.slug} layout exit={{ opacity: 0, x: -40 }} className="flex gap-3.5 border-b border-stone-200 py-[18px]">
                  <Link href={`/shop/${r.p.slug}`} className={`relative h-32 w-24 shrink-0 overflow-hidden rounded-[12px] bg-orange-100 ${r.status === "sold" ? "opacity-55" : ""}`}>
                    <Image src={r.p.images[0]} alt="" fill sizes="96px" className="object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/shop/${r.p.slug}`} className="text-[16px] leading-snug font-semibold">{r.p.name}</Link>
                      <SaveButton slug={r.p.slug} name={r.p.name} className="relative -mt-1 shadow-none" />
                    </div>
                    <span className={`text-[15px] ${r.status === "sold" ? "text-stone-400 line-through" : "text-stone-600"}`}>{priceLabel(r.p)}</span>
                    <span className={`flex items-center gap-1.5 text-[13px] font-medium ${tone(r)}`}>
                      <span className={`size-[7px] rounded-full ${dot(r)}`} />
                      {r.line}
                    </span>
                    <div className="mt-auto pt-2">{action(r)}</div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {/* Desktop: grid */}
          <ul className="container-page hidden grid-cols-4 gap-x-6 gap-y-11 lg:grid">
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <motion.li key={r.p.slug} layout exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col gap-3.5">
                  <div className="relative">
                    <Link href={`/shop/${r.p.slug}`} className="relative block aspect-[3/4] overflow-hidden rounded-[18px] bg-orange-100">
                      <Image src={r.p.images[0]} alt="" fill sizes="310px" className="object-cover" />
                      {r.status === "sold" && <span className="absolute inset-0 bg-orange-50/45" />}
                    </Link>
                    {r.status === "sold" && <span className="absolute top-3 left-3 rounded-full bg-stone-900 px-3 py-1 text-[13px] font-semibold text-orange-50">Sold</span>}
                    <SaveButton slug={r.p.slug} name={r.p.name} className="absolute top-3 right-3" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[17px] font-medium">{r.p.name}</span>
                    <span className={`text-[16px] ${r.status === "sold" ? "text-stone-400 line-through" : "text-stone-600"}`}>{priceLabel(r.p)}</span>
                    <span className={`text-[13px] font-semibold ${tone(r)}`}>{r.line}</span>
                  </div>
                  <div>{action(r)}</div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="container-page mt-8 lg:hidden">
            <div className="flex flex-col gap-3.5 rounded-[22px] bg-orange-100 p-5">
              <p className="font-serif text-[22px]">Can’t decide?</p>
              <p className="text-[15px] leading-[1.5] text-stone-600">Send your saved list to Mimi on WhatsApp. She can tell you about fit, colours, or make one in your size.</p>
              <a href={whatsappLink(message)} target="_blank" rel="noreferrer" className={buttonClass("primary", "md", "w-full")}>
                <WhatsAppIcon size={18} /> Send my list to Mimi
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
