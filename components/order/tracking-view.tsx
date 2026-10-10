"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { confirmPaymentSent } from "@/app/actions/orders";
import { WhatsAppIcon } from "@/components/icons";
import { ShopOrderCard } from "@/components/cart/shop-order-card";
import { Confetti } from "@/components/ui/confetti";
import { StageIcon } from "@/components/order/stage-icons";
import { Button, buttonClass, linkClass } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { depositOf, findOrder, updateOrder, useOrders, type Order } from "@/lib/orders";
import { formatNaira, whatsappLink } from "@/lib/site";
import { stages } from "@/lib/stages";

const ease = [0.22, 1, 0.36, 1] as const;

function pieceWord(name: string) {
  const n = name.toLowerCase();
  if (n.includes("dress")) return "dress";
  if (n.includes("shirt")) return "shirt";
  if (n.includes("set") || n.includes("bikini") || n.includes("shorts")) return "set";
  if (n.includes("hat") || n.includes("beanie")) return "hat";
  if (n.includes("earring")) return "earrings";
  if (n.includes("sweater") || n.includes("cardigan") || n.includes("vest")) return "top";
  return "piece";
}

function headline(o: Order) {
  const w = pieceWord(o.piece.name);
  const isAre = w === "earrings" ? "are" : "is";
  if (o.stage === 0 && o.sent === false) return { title: "Not sent to Mimi yet", lead: "Send your request on WhatsApp so Mimi gets it. This page follows every step after that." };
  if (o.stage === 0) return { title: "Mimi has your idea", lead: "She’ll message you on WhatsApp to agree the price and the date." };
  if (o.stage === 1 && !o.depositPaid && o.paymentSent) return { title: "Payment sent", lead: "Mimi is checking her bank. This page moves on as soon as she confirms it." };
  if (o.stage === 1 && !o.depositPaid) return { title: "Your price is ready", lead: "Mimi starts as soon as your payment arrives: the deposit or the full price." };
  if (o.stage === 1) return { title: o.paidInFull ? "Paid in full" : "Deposit received", lead: "Mimi is picking your yarn and starting soon." };
  if (o.stage === 2) return { title: `Your ${w} ${isAre} being made`, lead: `Mimi started on it. She’ll update this page when it’s ready to send.` };
  if (o.stage === 3) return { title: `Your ${w} ${isAre} ready`, lead: "Mimi is passing your number to a rider. You pay the rider when it arrives." };
  return { title: "It’s home. Wear it loud.", lead: "Thank you for ordering from Mimi." };
}

/* ------------- the signature moment: spotlight what changed since the last visit ------------- */

function SpotlightOutline({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.svg className="pointer-events-none absolute -inset-[2px] z-20 h-[calc(100%+4px)] w-[calc(100%+4px)] overflow-visible" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.6 } }} aria-hidden>
          <defs>
            <linearGradient id="spot" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fbbf24" />
              <stop offset="0.5" stopColor="#fb7185" />
              <stop offset="1" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <motion.rect x="0" y="0" width="100%" height="100%" rx="22" fill="none" stroke="url(#spot)" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: "easeInOut", delay: 0.35 }} />
        </motion.svg>
      )}
    </AnimatePresence>
  );
}

const seenKey = (code: string) => `mimi:seen:${code}`;

function useSpotlight(o: Order | undefined, target: RefObject<HTMLDivElement | null>) {
  const reduce = useReducedMotion();
  // settle: the blur is fading out and the cards still sit above it, so they never sink under it.
  const [phase, setPhase] = useState<"idle" | "lift" | "settle" | "done">("idle");
  useEffect(() => {
    if (!o) return;
    let seen = o.stage;
    const markSeen = () => {
      try {
        window.localStorage.setItem(seenKey(o.code), String(o.stage));
      } catch {}
    };
    try {
      const raw = window.localStorage.getItem(seenKey(o.code));
      // First visit to the demo order: pretend the customer last saw "Price agreed".
      seen = raw === null ? (o.sample ? o.stage - 1 : o.stage) : Number(raw);
    } catch {}
    if (reduce || o.stage <= seen) {
      markSeen();
      return;
    }
    // Only mark it seen once the moment has actually played.
    const timers: ReturnType<typeof setTimeout>[] = [];
    const lift = () => {
      setPhase("lift");
      timers.push(
        setTimeout(() => {
          setPhase("settle");
          markSeen();
        }, 2300),
        setTimeout(() => setPhase("done"), 2900),
      );
    };
    timers.push(
      setTimeout(() => {
        // On phones the latest update sits below the stepper, often under the fold: bring it into
        // view first, so the lift isn't a blur over nothing.
        const el = target.current;
        const r = el?.getBoundingClientRect();
        if (el && r && window.matchMedia("(max-width: 1023px)").matches && (r.top < 72 || r.bottom > window.innerHeight)) {
          el.scrollIntoView({ behavior: "smooth", block: r.height > window.innerHeight - 96 ? "start" : "center" });
          timers.push(setTimeout(lift, 650));
        } else lift();
      }, 700),
    );
    return () => timers.forEach(clearTimeout);
  }, [o, reduce, target]);
  return phase;
}

/* ------------------------------------ pieces ------------------------------------ */

export function Stepper({ stage, lifted = false }: { stage: number; lifted?: boolean }) {
  return (
    <ol className="flex items-start justify-between" aria-label="Order stages">
      {stages.map((s, i) => {
        const done = i < stage;
        const now = i === stage;
        return (
          <li key={s.key} className="relative flex flex-1 flex-col items-center gap-1.5" aria-current={now ? "step" : undefined}>
            {i > 0 && (
              <span className="absolute top-[17px] right-1/2 left-[-50%] -z-0 h-0.5 bg-stone-200">
                <motion.span className="block h-full origin-left bg-stone-900" initial={false} animate={{ scaleX: i <= stage ? 1 : 0 }} transition={{ duration: 0.6, ease, delay: lifted ? 0.5 : 0 }} />
              </span>
            )}
            <motion.span
              className={`relative z-10 grid size-9 place-items-center rounded-full ${
                now ? "bg-amber-100 text-amber-800 shadow-[0_0_0_4px_#fde68a]" : done ? "bg-stone-900 text-orange-50" : "border border-dashed border-stone-300 bg-white text-stone-400"
              }`}
              animate={now && lifted ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <StageIcon index={i} />
            </motion.span>
            <span className={`text-[12px] ${now ? "font-semibold text-stone-900" : done ? "font-medium text-stone-700" : "text-stone-400"}`}>{s.short}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** The price is agreed: pay the 60% deposit (40% when it's ready) or the whole price now, by bank transfer. */
function PayCard({ order, price }: { order: Order; price: number }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [full, setFull] = useState(false);
  const [saving, setSaving] = useState(false);
  const deposit = depositOf(price);
  const now = full ? price : deposit;
  const paid = async () => {
    const which = full ? "full" : "deposit";
    updateOrder(order.id, { paymentSent: which });
    if (!order.onServer) return;
    // The server holds the order: tell it, then show the page as it now stands.
    setSaving(true);
    await confirmPaymentSent(order.code, which).catch(() => false);
    router.refresh();
    setSaving(false);
  };
  return (
    <Card className="flex flex-col gap-4 border border-amber-200 bg-amber-50">
      <div className="flex flex-wrap gap-2" role="group" aria-label="How much to pay now">
        <Chip on={!full} onClick={() => setFull(false)}>60% deposit</Chip>
        <Chip on={full} onClick={() => setFull(true)}>Pay in full</Chip>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[14px] font-semibold text-amber-800">{full ? "Pay in full now" : "Deposit to pay now (60%)"}</span>
        <span className="relative h-[34px] overflow-hidden" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={now}
              className="block font-sans text-[34px] leading-none font-semibold tracking-[-0.01em]"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0 }}
            >
              {formatNaira(now)}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
      <p className="text-[15px] leading-[1.5] text-stone-700">Pay by bank transfer to the account Mimi sent with your price on WhatsApp, then tap below. She checks her bank and starts.</p>
      <Button onClick={paid} disabled={order.sample || saving}>
        {full ? "I’ve paid in full" : "I’ve paid the deposit"}
      </Button>
      <p className="text-[13px] text-amber-800">
        {full ? "Nothing more to pay when it’s ready." : `Balance when it’s ready (40%): ${formatNaira(price - deposit)}.`} Delivery is paid to the rider on arrival.
      </p>
    </Card>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[22px] bg-white p-5 lg:p-6 ${className}`}>{children}</section>;
}

/* ------------------------------- shop orders ------------------------------- */

function ShopTracking({ order, justPaid }: { order: Order; justPaid: boolean }) {
  const reduce = useReducedMotion();
  const host = useSyncExternalStore(() => () => {}, () => window.location.host, () => "");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/t/${order.code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyFailed(true);
    }
  };
  // The paid moment plays once: drop ?paid=1 so a reload opens on the order as it stands.
  useEffect(() => {
    if (justPaid) window.history.replaceState(null, "", `/t/${order.code}`);
  }, [justPaid, order.code]);

  return (
    <div className="container-page flex justify-center pt-8 pb-24 lg:pt-14">
      <div className="flex w-full max-w-[560px] flex-col gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          {justPaid ? (
            <motion.span className="relative mb-1 grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-800" initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 18 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                <motion.path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.15 }} />
              </svg>
              <Confetti />
            </motion.span>
          ) : (
            <span className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-[13px] font-medium">Order {order.id}</span>
          )}
          <h1 className="font-serif text-[36px] leading-[1.05] lg:text-[52px]">
            {justPaid ? "Paid! It’s all yours." : ["Paid. Mimi is packing it.", "Packing your order", "It’s on its way", "It’s home. Wear it loud."][order.stage]}
          </h1>
          <p className="max-w-[460px] text-[16px] leading-[1.5] text-stone-600">
            {justPaid ? (
              <>
                Mimi is packing your order and will pass your number to a rider. Your order number is <span className="whitespace-nowrap">{order.id}</span>, and your receipt is below.
              </>
            ) : (
              "Mimi passes your number to a rider. You pay the rider for delivery when it arrives."
            )}
          </p>
        </div>
        <ShopOrderCard order={order} />
        {justPaid && (
          <div className="flex flex-col gap-2 rounded-[22px] border border-stone-200 bg-white p-5">
            <span className="text-[15px] font-semibold">Your tracking link</span>
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-[16px] font-medium">
                {host}/t/{order.code}
              </span>
              <Button variant="secondary" size="sm" onClick={copy} className="shrink-0">
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <span className="text-[14px] text-stone-500" role={copyFailed ? "status" : undefined}>
              {copyFailed ? "Couldn’t copy. Press and hold the link to copy it." : "You’re on it now. Save it: it shows every step, from today to your door."}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-2 rounded-[22px] border border-stone-200 bg-white p-5 text-[15px]">
          <span className="font-semibold">Receipt</span>
          {order.items?.map((i) => (
            <div key={i.slug} className="flex justify-between gap-4"><span className="text-stone-600">{i.name}</span><span>{formatNaira(i.price)}</span></div>
          ))}
          <div className="flex justify-between"><span className="text-stone-600">Delivery</span><span>Paid to the rider</span></div>
          {order.price !== undefined && (
            <div className="flex justify-between border-t border-stone-100 pt-2 font-semibold"><span>Paid with Paystack</span><span>{formatNaira(order.price)}</span></div>
          )}
        </div>
        <a href={whatsappLink(`Hi Mimi! It’s about my order ${order.id}.`)} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-[22px] bg-white p-4 hover:bg-orange-100/60">
          <span className="grid size-10 place-items-center rounded-full bg-orange-100 font-serif text-[17px] text-amber-800">M</span>
          <span className="flex flex-1 flex-col"><span className="text-[15px] font-semibold">Mimi</span><span className="text-[13px] text-stone-500">Usually replies the same day</span></span>
          <WhatsAppIcon size={20} />
        </a>
        {justPaid && (
          <Link href="/shop" className={`${linkClass} self-center`}>
            Back to the shop
          </Link>
        )}
        <p className="text-center text-[13px] text-stone-400">Keep this link to yourself: it shows your order details.</p>
      </div>
    </div>
  );
}

/** `saved` is the server's copy of the order, when it has one; otherwise the order is looked up on this phone. */
export function TrackingView({ code, saved, justPaid = false }: { code: string; saved?: Order | null; justPaid?: boolean }) {
  const orders = useOrders();
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);
  const local = findOrder(orders, code);
  // The server's copy is the real one. This phone's copy fills in while the customer's photos are still
  // uploading (its small previews), and covers orders the server couldn't save and the example order.
  // Kept as one object until either copy changes: the spotlight below restarts whenever the order changes.
  const order = useMemo(() => {
    if (!saved) return local;
    const photos = saved.photos.length ? saved.photos : (local?.photos ?? []);
    return { ...saved, photos, piece: saved.piece.image ? saved.piece : { ...saved.piece, image: local?.piece.image ?? photos[0] } };
  }, [saved, local]);
  const latestRef = useRef<HTMLDivElement>(null);
  const phase = useSpotlight(order, latestRef);
  const [showAll, setShowAll] = useState(false);

  if (!hydrated) return <div className="min-h-[70vh]" />;
  if (!order)
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-start justify-center gap-4 py-16">
        <h1 className="font-serif text-[36px] leading-tight lg:text-[48px]">We can’t find that order</h1>
        <p className="max-w-[520px] text-[17px] text-stone-600">Check the link, or find your order with its number and the last 4 digits of your phone. Tracking links look like mimicrochet.ng/t/k7x2p9.</p>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
          <Link href="/track" className={buttonClass("primary")}>
            Find your order
          </Link>
          <a href={whatsappLink("Hi Mimi! Could you send me my tracking link?")} target="_blank" rel="noreferrer" className={linkClass}>
            <WhatsAppIcon size={18} /> Ask Mimi
          </a>
        </div>
      </div>
    );

  if (order.kind === "shop") return <ShopTracking order={order} justPaid={justPaid} />;

  const h = headline(order);
  const latest = order.updates[order.updates.length - 1];
  const lifted = phase === "lift";
  const raised = lifted || phase === "settle";
  const deposit = order.price ? depositOf(order.price) : undefined;
  const balance = order.price && deposit ? order.price - deposit : undefined;
  const awaitingDeposit = order.stage === 1 && !order.depositPaid && order.price;
  const settled = order.paidInFull || order.stage >= 4;
  const ask = whatsappLink(`Hi Mimi! It’s about my order ${order.id}.`);

  const latestCard = (
    <div ref={latestRef} className={`relative scroll-mt-20 transition-[transform,box-shadow] duration-500 ${raised ? "z-40" : ""} ${lifted ? "scale-[1.03] shadow-[0_30px_80px_-20px_rgb(28_25_23/0.35)]" : ""} rounded-[22px]`}>
      <SpotlightOutline show={lifted} />
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">Latest from Mimi</h2>
          <span className="text-[14px] text-stone-500">{latest.at}</span>
        </div>
        {latest.photo && (
          <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-orange-100">
            <Image src={latest.photo} alt="Mimi’s latest progress photo" fill sizes="(min-width: 1024px) 600px, 90vw" className="object-cover" preload unoptimized={latest.photo.startsWith("/api/")} />
          </div>
        )}
        <div className="flex gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-orange-100 font-serif text-[15px] text-amber-800">M</span>
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold">Mimi</span>
            <AnimatePresence mode="wait">
              <motion.p key={latest.note} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[15px] leading-[1.5] text-stone-600">
                {latest.note}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </Card>
    </div>
  );

  const timeline = (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold">Every update</h2>
        <button type="button" onClick={() => setShowAll((v) => !v)} className="text-[14px] font-medium underline underline-offset-4" aria-expanded={showAll}>
          {showAll ? "Hide" : "Show"}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {showAll && (
          <motion.ol initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {stages.map((s, i) => {
              const u = order.updates.filter((x) => x.stage === i).at(-1);
              const done = i <= order.stage;
              return (
                <li key={s.key} className="relative flex gap-3.5 pt-5">
                  <span className="flex flex-col items-center">
                    <span className={`mt-1 size-3 rounded-full ${i === order.stage ? "bg-amber-700 shadow-[0_0_0_4px_#fde68a]" : done ? "bg-stone-900" : "border-[1.5px] border-stone-300"}`} />
                    {i < stages.length - 1 && <span className={`mt-1 w-px flex-1 ${i < order.stage ? "bg-stone-900" : "bg-stone-200"}`} />}
                  </span>
                  <span className="flex flex-col pb-1">
                    <span className={`text-[16px] ${done ? "font-semibold" : "text-stone-400"}`}>{s.label}</span>
                    {u ? (
                      <>
                        <span className="text-[13px] text-stone-500">{u.at}</span>
                        <span className="text-[15px] text-stone-600">{u.note}</span>
                      </>
                    ) : (
                      <span className="text-[14px] text-stone-400">{i === order.stage + 1 ? "Up next" : i === stages.length - 1 ? "Last step" : ""}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </motion.ol>
        )}
      </AnimatePresence>
    </Card>
  );

  const money = order.price ? (
    awaitingDeposit ? (
      order.paymentSent ? (
        <Card className="flex flex-col gap-3 border border-amber-200 bg-amber-50">
          <span className="text-[14px] font-semibold text-amber-800">{order.paymentSent === "full" ? "Full payment sent" : "Deposit sent (60%)"}</span>
          <span className="text-[34px] leading-none font-semibold tracking-[-0.01em]">{formatNaira(order.paymentSent === "full" ? order.price : deposit!)}</span>
          <p className="text-[15px] leading-[1.5] text-stone-700">Mimi is checking her bank. Once it’s there, this page moves to “In progress”.</p>
        </Card>
      ) : (
        <PayCard order={order} price={order.price} />
      )
    ) : (
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[14px] text-stone-500">{settled ? "Paid in full" : "Left to pay when it’s ready (40%)"}</span>
          <span className="text-[34px] leading-none font-semibold tracking-[-0.01em]">{formatNaira(settled ? order.price : balance!)}</span>
        </div>
        <dl className="flex flex-col gap-2 border-t border-stone-100 pt-4 text-[15px]">
          <div className="flex justify-between"><dt className="text-stone-500">Price</dt><dd>{formatNaira(order.price)}</dd></div>
          {order.paidInFull ? (
            <div className="flex justify-between"><dt className="text-stone-500">Paid up front</dt><dd>−{formatNaira(order.price)}</dd></div>
          ) : (
            <div className="flex justify-between"><dt className="text-stone-500">Deposit paid (60%)</dt><dd>−{formatNaira(deposit!)}</dd></div>
          )}
          {order.stage >= 4 && !order.paidInFull && <div className="flex justify-between"><dt className="text-stone-500">Balance paid (40%)</dt><dd>−{formatNaira(balance!)}</dd></div>}
          <div className="flex justify-between font-semibold"><dt>{settled ? "Left to pay" : "Balance (40%)"}</dt><dd>{formatNaira(settled ? 0 : balance!)}</dd></div>
        </dl>
        <p className="text-[13px] text-stone-500">{settled ? "Nothing more to pay." : "Mimi confirms how to pay on WhatsApp."} Delivery is paid to the rider on arrival.</p>
      </Card>
    )
  ) : null;

  // Once it's delivered, invite a photo: it's how "Worn, loved, re-worn" on Home gets new stories.
  const photoAsk = (
    <Card className="flex flex-col gap-4">
      {order.piece.image && (
        <span className="relative block aspect-[4/5] overflow-hidden rounded-[18px] bg-orange-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.piece.image} alt={order.piece.name} className="size-full object-cover" />
        </span>
      )}
      <h2 className="font-serif text-[26px] leading-[1.15] text-balance">Wearing it? Send Mimi a photo</h2>
      <p className="text-[15px] leading-[1.55] text-stone-600">
        She’d love to see it. If you’re happy for her to share it, your photo and a few words could appear in “Worn, loved, re-worn” on the site.
      </p>
      <a
        href={whatsappLink(`Hi Mimi! It’s ${order.name}, order ${order.id}. Here’s me in my ${order.piece.name}.`)}
        target="_blank"
        rel="noreferrer"
        className={`${buttonClass("primary")} self-start max-sm:self-stretch`}
      >
        <WhatsAppIcon size={18} /> Send Mimi a photo
      </a>
    </Card>
  );

  const details = (
    <Card className="flex flex-col gap-4">
      <h2 className="text-[16px] font-semibold">Your order</h2>
      <div className="flex items-center gap-3">
        {order.piece.image && (
          <span className="relative h-[75px] w-14 shrink-0 overflow-hidden rounded-[8px] bg-orange-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={order.piece.image} alt="" className="size-full object-cover" />
          </span>
        )}
        <span className="flex flex-col">
          <span className="text-[15px] font-medium">{order.piece.name}</span>
          <span className="text-[14px] text-stone-500">
            {[order.size ? `Size ${order.size}` : order.measurements ? "Your measurements" : "", order.colours === "photo" ? "Colours as in the photo" : order.colourNote].filter(Boolean).join(" · ")}
          </span>
        </span>
      </div>
      <dl className="flex flex-col gap-2 border-t border-stone-100 pt-4 text-[15px]">
        <div className="flex justify-between gap-6"><dt className="text-stone-500">Delivery to</dt><dd className="text-right">{order.area}, {order.state}</dd></div>
        {order.readyBy && <div className="flex justify-between"><dt className="text-stone-500">Expected ready</dt><dd>{order.readyBy}</dd></div>}
        <div className="flex justify-between"><dt className="text-stone-500">Order</dt><dd>{order.id}</dd></div>
      </dl>
    </Card>
  );

  const contact = (
    <a href={ask} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-[22px] bg-white p-4 hover:bg-orange-100/60">
      <span className="grid size-10 place-items-center rounded-full bg-orange-100 font-serif text-[17px] text-amber-800">M</span>
      <span className="flex flex-1 flex-col">
        <span className="text-[15px] font-semibold">Mimi</span>
        <span className="text-[13px] text-stone-500">Usually replies the same day</span>
      </span>
      <WhatsAppIcon size={20} />
    </a>
  );

  return (
    <div className="relative pb-28 lg:pb-24">
      <AnimatePresence>
        {lifted && (
          <motion.div className="fixed inset-0 z-30 bg-orange-50/50 backdrop-blur-[6px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }} aria-hidden />
        )}
      </AnimatePresence>

      <div className="container-page flex flex-col items-center gap-3 pt-8 pb-6 text-center lg:pt-14 lg:pb-10">
        <span className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-[13px] font-medium">Order {order.id}</span>
        <h1 className="max-w-[640px] font-serif text-[36px] leading-[1.05] tracking-[-0.01em] text-balance lg:text-[56px]">{h.title}</h1>
        <p className="max-w-[520px] text-[16px] text-stone-600 lg:text-[18px]">{h.lead}</p>
        {order.sample && <p className="text-[13px] text-stone-400">This is an example order, so you can see how tracking works.</p>}
      </div>

      <div className="container-page flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        <div className="flex flex-col gap-4 lg:flex-1">
          <div className={`relative rounded-[22px] transition-transform duration-500 ${raised ? "z-40" : ""}`}>
            <Card className="flex flex-col gap-5">
              <Stepper stage={order.stage} lifted={lifted} />
              {order.readyBy && (
                <div className="flex justify-between border-t border-stone-100 pt-4 text-[15px]">
                  <span className="text-stone-500">{order.stage >= 4 ? "Delivered" : "Expected ready"}</span>
                  <span className="font-semibold">{order.readyBy}</span>
                </div>
              )}
            </Card>
          </div>
          {latestCard}
          {order.stage >= 4 && photoAsk}
          {timeline}
        </div>
        <div className="flex flex-col gap-4 lg:sticky lg:top-28 lg:w-[400px]">
          {money}
          {details}
          {contact}
          <p className="pt-1 text-center text-[13px] text-stone-400">Keep this link to yourself: it shows your order details.</p>
        </div>
      </div>

      <a
        href={ask}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-stone-900 px-5 py-3.5 text-[15px] font-semibold text-orange-50 shadow-[0_12px_32px_rgb(28_25_23/0.3)] lg:hidden"
      >
        <WhatsAppIcon size={18} /> Message Mimi
      </a>
    </div>
  );
}
