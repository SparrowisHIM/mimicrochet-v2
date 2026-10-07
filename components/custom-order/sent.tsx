"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useState, useSyncExternalStore } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { TrackingCard } from "@/components/order/tracking-card";
import { Button, linkClass } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import type { Order } from "@/lib/orders";
import { whatsappLink } from "@/lib/site";

const ease = [0.22, 1, 0.36, 1] as const;
const origin = () => window.location.origin;
const useOrigin = () => useSyncExternalStore(() => () => {}, origin, () => "");

export function orderMessage(o: Order) {
  const parts = [`Hi Mimi! I'd like to discuss this custom request: ${o.id}`];
  let what = o.piece.source === "photo" ? "from my photo" : o.piece.source === "words" ? "my own idea" : `the ${o.piece.name}`;
  if (o.size) what += ` in size ${o.size}`;
  const visual = o.piece.source !== "words";
  what += o.colours === "different" ? `, in ${o.colourNote}` : visual ? ", colours as in the photo" : ", colours your choice";
  parts[0] += `, ${what}.`;
  parts.push(`Deliver to ${o.area}, ${o.state}.`);
  if (o.measurements) {
    const m = o.measurements;
    const bits = (["bust", "waist", "hips", "length"] as const).filter((k) => m[k]).map((k) => `${k} ${m[k]}cm`);
    if (bits.length) parts.push(`My measurements: ${bits.join(", ")}.`);
  }
  if (o.when !== "No rush") parts.push(`I need it ${o.when.toLowerCase()}.`);
  if (o.description) parts.push(o.description);
  if (o.budget) parts.push(`My budget: ${o.budget}.`);
  if (o.notes) parts.push(`Notes: ${o.notes}`);
  parts.push(`My name is ${o.name}. You can reach me on ${o.phone}.`);
  return parts.join(" ");
}

export function SentView({ order, files }: { order: Order; files: File[] }) {
  const reduce = useReducedMotion();
  const base = useOrigin();
  const link = `${base}/t/${order.code}`;
  const pretty = link.replace(/^https?:\/\//, "");
  const [message, setMessage] = useState(() => orderMessage(order));
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setHint("Couldn’t copy. Press and hold the link to copy it.");
    }
  };

  const send = async () => {
    const text = message;
    // Phones can share the photos and voice note straight into WhatsApp with the message.
    if (files.length && navigator.canShare?.({ files, text })) {
      try {
        await navigator.share({ files, text });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // cancelled: fall back to the chat link
      }
    }
    window.open(whatsappLink(text), "_blank", "noopener");
    if (files.length) setHint("WhatsApp opened with your message. Attach your photos in the chat too.");
  };

  const rise = (delay: number) => (reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease, delay } });

  return (
    <div className="container-page flex justify-center pt-8 pb-20 lg:pt-16 lg:pb-28">
      <div className="flex w-full max-w-[560px] flex-col gap-6">
        <div className="relative">
          <motion.span
            className="relative grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-800"
            initial={reduce ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 18 }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
              <motion.path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.15 }} />
            </svg>
            <Confetti />
          </motion.span>
        </div>
        <motion.div {...rise(0.1)} className="flex flex-col gap-3">
          <h1 className="font-serif text-[36px] leading-[1.05] tracking-[-0.01em] lg:text-[52px]">Your idea, ready for Mimi.</h1>
          <p className="text-[16px] leading-[1.5] text-stone-600 lg:text-[18px]">
            Your request number is <span className="whitespace-nowrap">{order.id}</span>. Check your message below, then send it on WhatsApp so Mimi can agree the price and timing with you.
          </p>
        </motion.div>

        <motion.div {...rise(0.2)}>
          <TrackingCard orderId={order.id} piece={order.piece.name} stage={0} note="Ready to share. Send your request on WhatsApp to agree the next step." noteFrom="Just now" />
        </motion.div>

        <motion.div {...rise(0.3)} className="flex flex-col gap-2.5 rounded-[22px] border border-stone-200 bg-white p-5">
          <span className="text-[15px] font-semibold">Preview your order</span>
          <div className="flex items-center justify-between gap-3">
            <Link href={`/t/${order.code}`} className="truncate text-[16px] font-medium underline-offset-4 hover:underline">
              {pretty || `/t/${order.code}`}
            </Link>
            <Button variant="secondary" size="sm" onClick={copy} className="shrink-0">
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <span className="text-[14px] text-stone-500">This preview is saved on this browser only. Live tracking across devices is not connected yet.</span>
        </motion.div>

        <motion.div {...rise(0.4)} className="flex flex-col gap-3 rounded-[22px] border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[15px] font-semibold">
              <WhatsAppIcon size={17} /> Message to Mimi <span className="text-[13px] font-normal text-stone-400">draft</span>
            </span>
            <button type="button" onClick={() => setEditing((v) => !v)} className="text-[14px] font-medium underline underline-offset-4">
              {editing ? "Done" : "Edit"}
            </button>
          </div>
          {editing ? (
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="w-full rounded-[12px] border border-stone-300 p-3 text-[15px] leading-[1.5] outline-none focus:border-stone-900" aria-label="Edit the message" />
          ) : (
            <p className="border-l-2 border-stone-200 pl-3 text-[15px] leading-[1.55] text-stone-700">{message}</p>
          )}
          {(order.photos.length > 0 || order.hasVoiceNote) && (
            <div className="flex items-center gap-2 pl-3">
              {order.photos.slice(0, 4).map((src, i) => (
                <motion.span
                  key={src.slice(-24) + i}
                  className="relative h-[50px] w-10 overflow-hidden rounded-[8px] border-2 border-white shadow-sm"
                  initial={reduce ? false : { opacity: 0, scale: 0.6, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.4, ease, delay: 0.6 + i * 0.12 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="size-full object-cover" />
                </motion.span>
              ))}
              <span className="text-[13px] text-stone-500">
                {[order.photos.length ? `${order.photos.length} photo${order.photos.length > 1 ? "s" : ""}` : "", order.hasVoiceNote ? "a voice note" : ""].filter(Boolean).join(" and ")} attached
              </span>
            </div>
          )}
        </motion.div>

        <motion.div {...rise(0.5)} className="flex flex-col gap-3">
          <Button onClick={send} arrow={false}>
            <WhatsAppIcon size={18} /> Send on WhatsApp
          </Button>
          {hint && <p className="text-center text-[14px] text-amber-800" role="status">{hint}</p>}
          <Link href="/shop" className={`${linkClass} self-center`}>
            Back to the shop
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
