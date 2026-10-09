"use client";

import Image from "next/image";
import { animate as animateValue, motion, stagger, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/ui/confetti";

// The moment a custom order is sent, told in four beats:
// 1. your request card is stitched closed, row by row,
// 2. a swing tag drops on its thread and your order number is typed onto it,
// 3. the card folds into a parcel and flies along a yarn thread to Mimi,
// 4. Mimi's photo pulses, "Sent" lands, a small burst, then the confirmation page.

export type SendingRow = { key: string; value: string };

const captions = ["Stitching your request together", "Adding your request number", "Drafting your WhatsApp message", "Ready for Mimi"];
const W = 304; // card width (fits a 344px phone with the page gutter)
const H = 348;

export function SendingMoment({
  orderId,
  image,
  title,
  rows,
  onDone,
}: {
  orderId: string;
  image?: string;
  title: string;
  rows: SendingRow[];
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [beat, setBeat] = useState(0);
  const [typed, setTyped] = useState(0);
  const [burst, setBurst] = useState(false);
  const [path, setPath] = useState("");
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const done = useRef(onDone);

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let alive = true;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    async function run() {
      if (reduce) {
        await wait(150);
        if (alive) done.current();
        return;
      }

      // Measure the card once so the stitched border can be drawn to its exact size.
      const el = scope.current?.querySelector<HTMLElement>("[data-card]");
      if (el) setBox({ w: el.offsetWidth, h: el.offsetHeight });
      await wait(20);

      // 1. Card arrives and gets stitched closed.
      await animate("[data-card]", { opacity: [0, 1], y: [90, 0], rotateX: [24, 0], scale: [0.9, 1] }, { type: "spring", stiffness: 210, damping: 22 });
      animate("[data-stitch]", { pathLength: [0, 1] }, { duration: 1.05, ease: [0.65, 0, 0.35, 1] });
      await animate("[data-row-check]", { scale: [0, 1.3, 1], opacity: [0, 1, 1] }, { duration: 0.34, delay: stagger(0.13) });
      await wait(260);
      if (!alive) return;

      // 2. The swing tag drops and swings; the order number is typed onto it.
      setBeat(1);
      animate("[data-tag-string]", { scaleY: [0, 1] }, { duration: 0.3, ease: "easeOut" });
      await animate("[data-tag]", { opacity: [0, 1], y: [-46, 0], rotate: [-38, 16, -9, 5, -2, 0] }, { duration: 1.05, ease: "easeOut" });
      await new Promise<void>((resolve) =>
        animateValue(0, orderId.length, { duration: 0.55, ease: "linear", onUpdate: (v) => setTyped(Math.round(v)), onComplete: resolve }),
      );
      await wait(420);
      if (!alive) return;

      // 3. Fold into a parcel, Mimi appears, the yarn thread draws, and it flies to her.
      setBeat(2);
      animate("[data-tag]", { opacity: 0, scale: 0.6 }, { duration: 0.25 });
      animate("[data-tag-string]", { opacity: 0 }, { duration: 0.2 });
      animate("[data-stitch-svg]", { opacity: 0 }, { duration: 0.2 });
      await animate("[data-rows]", { opacity: 0, height: 0, marginTop: 0 }, { duration: 0.42, ease: [0.65, 0, 0.35, 1] });
      await animate("[data-card]", { scale: 0.62, rotate: -5 }, { type: "spring", stiffness: 300, damping: 18 });
      await animate("[data-mimi]", { opacity: [0, 1], scale: [0.5, 1], y: [20, 0] }, { type: "spring", stiffness: 320, damping: 20 });

      const root = scope.current?.getBoundingClientRect();
      const card = scope.current?.querySelector("[data-card]")?.getBoundingClientRect();
      const mimi = scope.current?.querySelector("[data-mimi-photo]")?.getBoundingClientRect();
      if (!root || !card || !mimi) return done.current();
      const from = { x: card.left + card.width / 2 - root.left, y: card.top + card.height / 2 - root.top };
      const to = { x: mimi.left + mimi.width / 2 - root.left, y: mimi.top + mimi.height / 2 - root.top };
      const bend = from.x + (to.x >= from.x ? 140 : -140);
      setPath(`M ${from.x} ${from.y} C ${bend} ${from.y - 60}, ${bend} ${to.y + 90}, ${to.x} ${to.y}`);
      await wait(16);
      animate("[data-thread]", { pathLength: [0, 1], opacity: [0, 1] }, { duration: 0.55, ease: "easeOut" });
      await wait(240);

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      await animate(
        "[data-card]",
        {
          x: [0, dx * 0.15 + (bend - from.x) * 0.55, dx * 0.7 + (bend - from.x) * 0.35, dx],
          y: [0, dy * 0.12 - 40, dy * 0.62, dy],
          scale: [0.62, 0.5, 0.3, 0.1],
          rotate: [-5, 12, 22, 40],
          opacity: [1, 1, 1, 0],
        },
        { duration: 0.85, ease: [0.55, 0, 0.25, 1] },
      );
      if (!alive) return;

      // 4. Delivered.
      setBeat(3);
      animate("[data-thread]", { opacity: 0 }, { duration: 0.4 });
      animate("[data-ring]", { scale: [1, 2.1], opacity: [0.7, 0] }, { duration: 0.9, ease: "easeOut" });
      animate("[data-mimi-photo]", { scale: [1, 1.14, 1] }, { duration: 0.45 });
      setBurst(true);
      await animate("[data-badge]", { scale: [0, 1.25, 1], rotate: [-40, 0] }, { duration: 0.45 });
      await animate("[data-sent]", { opacity: [0, 1], y: [14, 0] }, { duration: 0.35 });
      await wait(950);
      if (alive) done.current();
    }

    run().catch(() => { if (alive) done.current(); });
    return () => {
      alive = false;
    };
  }, [animate, orderId, reduce, scope]);

  return (
    <motion.div
      ref={scope}
      className="fixed inset-0 z-50 overflow-hidden bg-stone-950/75 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      style={{ perspective: 1200 }}
      role="dialog"
      aria-modal="true"
      aria-label="Preparing your request"
      onKeyDown={(e) => { if (e.key === "Escape") done.current(); }}
    >
      <button autoFocus type="button" onClick={() => done.current()} className="absolute top-5 right-5 z-10 rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" aria-label="Skip the animation">Skip</button>
      {/* The yarn thread from the parcel to Mimi */}
      <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden>
        {path && <motion.path data-thread d={path} fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0, opacity: 0 }} />}
      </svg>

      <div className="relative flex h-full flex-col items-center justify-center gap-7 px-5">
        {/* Mimi */}
        <div data-mimi className="flex flex-col items-center gap-2 opacity-0">
          <span className="relative">
            <span data-ring className="absolute inset-0 rounded-full border-2 border-amber-300 opacity-0" aria-hidden />
            <span data-mimi-photo className="relative block size-[72px] overflow-hidden rounded-full border-[3px] border-orange-50 bg-orange-100 shadow-[0_12px_30px_-8px_rgb(0_0_0/0.6)]">
              <Image src="/images/story/mimi-portrait.jpg" alt="" fill sizes="72px" className="object-cover object-top" />
            </span>
            <span data-badge className="absolute -right-1 -bottom-1 grid size-7 scale-0 place-items-center rounded-full border-2 border-orange-50 bg-emerald-600 text-white">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {burst && <Confetti count={34} />}
          </span>
          <span className="text-[14px] font-semibold text-orange-50">Mimi</span>
        </div>

        {/* The request card */}
        <div className="relative" style={{ width: W }}>
          <div data-card className="relative rounded-[22px] bg-orange-50 p-5 opacity-0 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)]" style={{ transformStyle: "preserve-3d", minHeight: 96 }}>
            {/* stitched border: a dashed line revealed by a growing mask */}
            {box && (
              <svg data-stitch-svg className="pointer-events-none absolute -top-[7px] -left-[7px] overflow-visible" width={box.w + 14} height={box.h + 14} aria-hidden>
                <defs>
                  <mask id="stitch-mask" maskUnits="userSpaceOnUse">
                    <motion.rect data-stitch x="2" y="2" width={box.w + 10} height={box.h + 10} rx="26" fill="none" stroke="white" strokeWidth="6" initial={{ pathLength: 0 }} />
                  </mask>
                </defs>
                <rect x="2" y="2" width={box.w + 10} height={box.h + 10} rx="26" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="7 6" strokeLinecap="round" mask="url(#stitch-mask)" />
              </svg>
            )}

            <div className="flex items-center gap-3">
              <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-[9px] bg-orange-100">
                {image && <Image src={image} alt="" fill sizes="44px" className="object-cover" unoptimized={image.startsWith("data:")} />}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-serif text-[19px] leading-tight">{title}</span>
                <span className="text-[13px] text-stone-500">Custom order</span>
              </span>
            </div>

            <ul data-rows className="mt-3 flex flex-col overflow-hidden" style={{ maxHeight: H }}>
              {rows.map((r) => (
                <li key={r.key} className="flex items-center gap-2.5 border-t border-stone-200/70 py-2 text-[14px]">
                  <span data-row-check className="grid size-[18px] shrink-0 scale-0 place-items-center rounded-full bg-emerald-600 text-white">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-stone-500">{r.key}</span>
                  <span className="ml-auto max-w-[58%] truncate font-medium">{r.value}</span>
                </li>
              ))}
            </ul>

            {/* Swing tag on its thread */}
            <span data-tag-string className="absolute top-3 -right-1 h-9 w-px origin-top scale-y-0 bg-stone-400" aria-hidden />
            <div data-tag className="absolute top-11 -right-7 flex w-[118px] origin-top flex-col items-center gap-0.5 rounded-[10px] bg-amber-200 px-3 pt-4 pb-2.5 text-stone-900 opacity-0 shadow-[0_10px_24px_-10px_rgb(0_0_0/0.6)]">
              <span className="absolute top-1.5 size-2 rounded-full bg-stone-950/80" aria-hidden />
              <span className="text-[11px] font-medium text-amber-900">Your order</span>
              <span className="text-[16px] font-semibold tracking-tight whitespace-nowrap tabular-nums">
                {orderId.slice(0, typed)}
                {typed < orderId.length && beat === 1 && <span className="ml-px inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-stone-900" />}
              </span>
            </div>
          </div>
        </div>

        {/* Caption */}
        <div role="status" aria-live="polite" className="flex min-h-16 flex-col items-center gap-1 text-center">
          <motion.p key={beat} className="font-serif text-[24px] leading-tight text-orange-50" initial={reduce ? false : { opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.35 }}>
            {captions[beat]}
          </motion.p>
          <p data-sent className="text-[15px] text-stone-300 opacity-0">One more step: send it on WhatsApp.</p>
          <span className="mt-2 flex gap-1.5" aria-hidden>
            {captions.map((c, i) => (
              <motion.span key={c} className="h-1 rounded-full bg-orange-50" animate={{ width: i === beat ? 22 : 6, opacity: i <= beat ? 1 : 0.3 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            ))}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
