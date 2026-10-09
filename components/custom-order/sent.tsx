"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { TrackingCard } from "@/components/order/tracking-card";
import { Button, linkClass } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { fitWords } from "@/lib/fit";
import { kindName } from "@/lib/fit-outline";
import { updateOrder, type Order } from "@/lib/orders";
import { whatsappLink } from "@/lib/site";

const ease = [0.22, 1, 0.36, 1] as const;
const origin = () => window.location.origin;
const useOrigin = () => useSyncExternalStore(() => () => {}, origin, () => "");

export function orderMessage(o: Order) {
  const parts = [`Hi Mimi! I'd like to discuss this custom request: ${o.id}`];
  let what =
    o.piece.source === "photo"
      ? o.pieceKind ? `${kindName(o.pieceKind)} from my photo` : "from my photo"
      : o.piece.source === "words"
        ? o.pieceKind ? `${kindName(o.pieceKind)}, my own idea` : "my own idea"
        : o.piece.source === "story"
          ? `the ${o.piece.name.toLowerCase()}, ${o.piece.note?.toLowerCase() ?? "from your customer photos"} on your site`
          : `the ${o.piece.name}`;
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
  if (o.height) parts.push(`I'm ${o.height}cm tall.`);
  if (o.fit) parts.push(`How I'd like it to fit: ${fitWords(o.fit).toLowerCase()}.`);
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
  const [message, setMessage] = useState(() => orderMessage(order));
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  // Mimi only gets the request once it's sent on WhatsApp, so nothing celebrates until then.
  const [sent, setSent] = useState(Boolean(order.sent));
  const actions = useRef<HTMLDivElement>(null);
  const [barVisible, setBarVisible] = useState(false);

  // Phones: while the Send button is still further down the page, a bar keeps it in reach.
  useEffect(() => {
    const el = actions.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBarVisible(!e.isIntersecting && e.boundingClientRect.top > 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const markSent = () => {
    updateOrder(order.id, { sent: true, updates: [{ stage: 0, note: "Request sent to Mimi on WhatsApp.", at: "Today" }] });
    setBarVisible(false);
    const celebrate = () => {
      setSent(true);
      // After the old header has left, so the swap doesn't cancel the scroll.
      setTimeout(() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }), 320);
    };
    // WhatsApp usually takes over the screen: save the moment for when they come back to this page.
    setTimeout(() => {
      if (document.visibilityState === "visible") return celebrate();
      const back = () => {
        if (document.visibilityState !== "visible") return;
        document.removeEventListener("visibilitychange", back);
        celebrate();
      };
      document.addEventListener("visibilitychange", back);
    }, 250);
  };

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
        markSent();
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // cancelled: fall back to the chat link
      }
    }
    window.open(whatsappLink(text), "_blank", "noopener");
    markSent();
    if (files.length) setHint("WhatsApp opened with your message. Attach your photos in the chat too.");
  };

  const rise = (delay: number) => (reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease, delay } });

  return (
    // data-floating-bar: globals.css leaves room under the footer for the phone Send bar.
    <div className="container-page flex justify-center pt-8 pb-20 lg:pt-16 lg:pb-28" data-floating-bar>
      <div className="flex w-full max-w-[560px] flex-col gap-6">
        <AnimatePresence mode="wait" initial={false}>
          {sent ? (
            <motion.div key="sent" className="flex flex-col gap-6" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
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
              <div className="flex flex-col gap-3">
                <h1 className="font-serif text-[36px] leading-[1.05] tracking-[-0.01em] lg:text-[52px]">Sent. Mimi will reply on WhatsApp.</h1>
                <p className="text-[16px] leading-[1.5] text-stone-600 lg:text-[18px]">
                  She’ll agree the price and timing with you there. Your request number is <span className="whitespace-nowrap">{order.id}</span>.
                </p>
              </div>
              <TrackingCard orderId={order.id} piece={order.piece.name} stage={0} note="Sent on WhatsApp. Mimi usually replies the same day." noteFrom="Just now" />
            </motion.div>
          ) : (
            <motion.div key="unsent" className="flex flex-col gap-6" exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <motion.span
                className="grid size-14 place-items-center rounded-full bg-amber-100 text-amber-800"
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
              >
                <WhatsAppIcon size={26} />
              </motion.span>
              <motion.div {...rise(0.1)} className="flex flex-col gap-3">
                <h1 className="font-serif text-[36px] leading-[1.05] tracking-[-0.01em] lg:text-[52px]">One step left: send it to Mimi.</h1>
                <p className="text-[16px] leading-[1.5] text-stone-600 lg:text-[18px]">
                  Your request <span className="whitespace-nowrap">{order.id}</span> is ready, but Mimi doesn’t have it yet. Check your message below, then send it on WhatsApp.
                </p>
              </motion.div>
              <motion.div {...rise(0.2)}>
                <TrackingCard orderId={order.id} piece={order.piece.name} stage={-1} status="Not sent yet" note="Tap Send on WhatsApp below, and Mimi gets your idea." noteFrom="Next step" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The tracking page, named rather than shown as a raw web address. */}
        <motion.div {...rise(0.3)} className="flex flex-col gap-1.5 rounded-[22px] border border-stone-200 bg-white p-5">
          <span className="text-[15px] font-semibold">Your tracking page</span>
          <span className="text-[14px] text-stone-500">Every step, from Mimi’s first reply to your door. It’s in your WhatsApp message too.</span>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <Link href={`/t/${order.code}`} className={linkClass}>
              Track this order
            </Link>
            <Button variant="secondary" size="sm" onClick={copy} className="shrink-0">
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
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
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="min-h-[136px] w-full resize-none rounded-[12px] border border-stone-300 p-3 text-[15px] leading-[1.5] outline-none field-sizing-content focus:border-stone-900" aria-label="Edit the message" />
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

        <motion.div ref={actions} {...rise(0.5)} className="flex flex-col gap-3">
          <Button onClick={send} arrow={false}>
            <WhatsAppIcon size={18} /> {sent ? "Open WhatsApp again" : "Send on WhatsApp"}
          </Button>
          {hint && <p className="text-center text-[14px] text-amber-800" role="status">{hint}</p>}
          <Link href="/shop" className={`${linkClass} self-center`}>
            Back to the shop
          </Link>
        </motion.div>
      </div>

      {/* Phone: until the Send button is reached, a bar keeps the one step left in reach. */}
      <AnimatePresence>
        {barVisible && !sent && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 flex items-center gap-3 rounded-full bg-white p-1.5 pl-5 shadow-[0_12px_40px_rgb(28_25_23/0.22)] lg:hidden"
          >
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[14px] font-semibold">One step left</span>
              <span className="truncate text-[13px] text-stone-600">Mimi gets it once you send it</span>
            </span>
            <Button size="sm" className="h-11 px-5" arrow={false} onClick={send}>
              <WhatsAppIcon size={16} /> Send
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
