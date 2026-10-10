"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { signOut, studioConfirmPayment, studioMarkDelivered, studioMarkReady, studioSetPrice } from "@/app/actions/studio";
import { VoicePlayer } from "@/components/custom-order/voice-note";
import { ChevronIcon, WhatsAppIcon } from "@/components/icons";
import { PingCard } from "@/components/studio/ping-card";
import { Button, linkClass } from "@/components/ui/button";
import { DatePicker, shortDate } from "@/components/form/date-picker";
import { Chip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { Toggle } from "@/components/ui/toggle";
import { Stepper } from "@/components/order/tracking-view";
import { fitWords } from "@/lib/fit";
import { depositOf } from "@/lib/order-code";
import type { Order } from "@/lib/orders";
import type { StudioOrder } from "@/lib/server/studio";
import { checkPhoto } from "@/lib/upload-safety";
import { formatNaira } from "@/lib/site";
import { stages } from "@/lib/stages";

// Mimi's studio: her real orders from the server (app/studio/page.tsx), and every change she makes saved
// there, so the customer's page shows it at once. Signed in only (the server checks every action).

type Row = StudioOrder;

/** Customer files and progress photos come from this site's own server: no image resizing service. */
const unoptimized = (src: string) => src.startsWith("data:") || src.startsWith("/api/");

/** Runs one of Mimi's changes, then shows the page as it now stands. */
function useSave() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const run = async (save: () => Promise<boolean>, after?: () => void) => {
    if (busy) return false;
    setBusy(true);
    setFailed(false);
    const ok = await save().catch(() => false);
    setBusy(false);
    if (!ok) {
      setFailed(true);
      return false;
    }
    startTransition(() => router.refresh());
    after?.();
    return true;
  };
  return { run, busy: busy || refreshing, failed };
}

function SaveError({ show }: { show: boolean }) {
  return show ? (
    <p className="text-center text-[13px] text-red-700" role="alert">
      That didn’t save. Check you’re online, then try again.
    </p>
  ) : null;
}

const stageTone = ["bg-amber-100 text-amber-800", "bg-stone-100 text-stone-700", "bg-amber-100 text-amber-800", "bg-emerald-100 text-emerald-800", "bg-emerald-100 text-emerald-800"];
const stageName = ["New", "Price agreed", "In progress", "Ready", "Delivered"];
const dueClass = { normal: "text-stone-500", soon: "font-semibold text-amber-700", late: "font-semibold text-red-700" };
const waTo = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

function nextStep(o: Row) {
  if (o.stage === 0) return o.price ? "Agree the price" : o.piece.source === "photo" ? "Reply on WhatsApp" : "Agree the price";
  if (o.stage === 1) return o.depositPaid ? "Start making" : o.paymentSent ? "Check the payment" : "Waiting for payment";
  if (o.stage === 2) return o.dueTone === "late" ? `Tell ${o.name} about the delay` : "Send a progress photo";
  if (o.stage === 3) return "Book delivery";
  return "Done";
}

// Orders keep the customer's own wording ("From your photo"); Mimi reads them from her side.
function pieceName(o: Order) {
  if (o.piece.source === "photo") return "From their photo";
  if (o.piece.source === "words") return "Their own idea";
  return o.piece.name;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning, Mimi" : h < 17 ? "Good afternoon, Mimi" : "Good evening, Mimi";
}
/** The greeting uses Mimi's own clock, so it's worked out in her browser (the server's clock is UTC). */
const useGreeting = () => useSyncExternalStore(() => () => {}, greeting, () => "Hello, Mimi");

/* ------------------------------- action sheets ------------------------------- */

function SetPrice({ o, onDone }: { o: Row; onDone: () => void }) {
  const [price, setPrice] = useState(o.piece.price ? String(o.piece.price + 5000) : "");
  const [date, setDate] = useState("");
  const [today] = useState(() => Date.now());
  const [rush, setRush] = useState(0);
  const [riderPays, setRiderPays] = useState(true);
  const total = (Number(price.replace(/\D/g, "")) || 0) + rush;
  const deposit = depositOf(total);
  const ready = date ? shortDate(date) : "";
  const what = o.piece.source === "photo" || o.piece.source === "words" ? "custom piece" : o.piece.name;
  const msg = `Hi ${o.name}! Your ${what}${o.size ? ` in ${o.size}` : ""} is ${total ? formatNaira(total) : "₦…"}${ready ? `, ready by ${ready}` : ""}. To start, please pay the 60% deposit (${total ? formatNaira(deposit) : "₦…"}), or the full ${total ? formatNaira(total) : "price"} if you prefer. ${riderPays ? "Delivery is paid to the rider on arrival." : "Delivery is included."} Your order page: ${typeof window !== "undefined" ? window.location.origin : ""}/t/${o.code}`;
  const ok = total > 0 && Boolean(date);
  const save = useSave();

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-[14px] font-semibold">Price</span>
        <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="₦" className="h-12 rounded-[14px] border border-stone-300 bg-white px-3.5 text-[16px] outline-none focus:border-stone-900" />
      </label>
      <div className="flex flex-col gap-2.5">
        <span className="text-[14px] font-semibold">Ready by</span>
        <DatePicker id="ready-by" value={date || undefined} onChange={setDate} now={today} forMimi />
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="text-[14px] font-semibold">Rush extra (optional)</span>
        <div className="flex flex-wrap gap-2">
          {[0, 20000, 30000].map((r) => (
            <Chip key={r} on={rush === r} onClick={() => setRush(r)}>{r ? `+${formatNaira(r)}` : "None"}</Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="text-[14px] font-semibold">Delivery</span>
        <div className="flex flex-wrap gap-2">
          <Chip on={riderPays} onClick={() => setRiderPays(true)}>Rider, paid on arrival</Chip>
          <Chip on={!riderPays} onClick={() => setRiderPays(false)}>Included in price</Chip>
        </div>
      </div>
      <dl className="flex flex-col gap-1.5 rounded-[14px] bg-amber-100 px-4 py-3 text-[15px] text-amber-900">
        <div className="flex justify-between"><dt>Deposit now (60%)</dt><dd className="font-semibold">{formatNaira(deposit)}</dd></div>
        <div className="flex justify-between"><dt>Balance when ready (40%)</dt><dd className="font-semibold">{formatNaira(total - deposit)}</dd></div>
        <div className="flex justify-between border-t border-amber-200 pt-1.5"><dt>Or in full now</dt><dd className="font-semibold">{formatNaira(total)}</dd></div>
      </dl>
      <div className="flex flex-col gap-2 rounded-[22px] bg-white p-4">
        <span className="flex items-center gap-2 text-[14px] font-semibold"><WhatsAppIcon size={16} /> Message to {o.name} <span className="font-normal text-stone-400">draft</span></span>
        <p className="border-l-2 border-stone-200 pl-3 text-[14px] leading-[1.5] text-stone-600">{msg}</p>
      </div>
      <Button arrow={false}
        disabled={!ok || save.busy}
        aria-busy={save.busy}
        onClick={() => {
          // WhatsApp opens straight from the tap (phones block windows opened later), then it saves.
          window.open(waTo(o.phone, msg), "_blank", "noopener");
          save.run(() => studioSetPrice(o.code, total, date), onDone);
        }}
      >
        <WhatsAppIcon size={18} /> Save and send on WhatsApp
      </Button>
      <SaveError show={save.failed} />
      <p className="-mt-2 text-center text-[13px] text-stone-500">{o.name}’s order page updates as soon as you save.</p>
    </div>
  );
}

function PostUpdate({ o, onDone }: { o: Row; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const save = useSave();
  const post = () =>
    save.run(async () => {
      const form = new FormData();
      form.set("note", note);
      if (ready) form.set("ready", "1");
      if (photoFile) form.set("photo", photoFile);
      const res = await fetch(`/api/studio/orders/${o.code}/updates`, { method: "POST", body: form });
      return res.ok;
    }, onDone);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[15px] text-stone-600">{o.name} sees this on their tracking page.</p>
      <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; const c = await checkPhoto(f, { preview: 900 }); if (c.ok && c.preview) { setPhoto(c.preview); setPhotoFile(c.file); setPhotoNote(null); } else setPhotoNote(c.ok ? "That photo can’t be shown here. Try a JPEG or PNG." : c.reason); }} />
      <div className="grid grid-cols-3 gap-2.5">
        {photo ? (
          <span className="relative aspect-[3/4] overflow-hidden rounded-[18px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Your progress photo" className="size-full object-cover" />
          </span>
        ) : null}
        <button type="button" onClick={() => file.current?.click()} className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-[18px] border-[1.5px] border-dashed border-stone-300 text-[13px] text-stone-600 hover:border-stone-900">
          <span className="text-[22px] leading-none">+</span>
          {photo ? "Change" : "Camera or gallery"}
        </button>
      </div>
      {photoNote && <p className="-mt-2 text-[13px] text-amber-800" role="status">{photoNote}</p>}
      <label className="flex flex-col gap-2">
        <span className="text-[14px] font-semibold">Note (optional)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. The top is done. Starting the skirt now." className="h-12 rounded-[14px] border border-stone-300 bg-white px-3.5 text-[16px] outline-none focus:border-stone-900" />
      </label>
      <div className="flex flex-wrap gap-2">
        {["Halfway there", "Almost ready", "Ready to send"].map((q) => (
          <Chip key={q} on={note === q} onClick={() => setNote(q)}>{q}</Chip>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-[22px] bg-white p-4">
        <span className="flex flex-col">
          <span className="text-[15px] font-semibold">Also mark as ready</span>
          <span className="text-[13px] text-stone-500">Moves their page to “Ready”</span>
        </span>
        <Toggle label="Also mark as ready" hideLabel checked={ready} onChange={setReady} />
      </div>
      <Button disabled={(!note && !photo && !ready) || save.busy} aria-busy={save.busy} onClick={post}>
        Post update
      </Button>
      <SaveError show={save.failed} />
    </div>
  );
}

/* ------------------------------- order panel ------------------------------- */

/** What Mimi sees when she opens an order: where it stands, the one thing to do next, what was asked for, and the money. */
function OrderDetail({ o, onPrice, onUpdate }: { o: Row; onPrice: () => void; onUpdate: () => void }) {
  const deposit = o.price ? depositOf(o.price) : 0;
  const late = o.dueTone === "late";
  const message = (text: string) => waTo(o.phone, text);
  const save = useSave();
  const confirm = (full: boolean) => save.run(() => studioConfirmPayment(o.code, full));
  const markReady = () => save.run(() => studioMarkReady(o.code));

  const next =
    o.stage === 0
      ? {
          title: `Agree ${o.name}’s price`,
          text: o.piece.source === "photo" ? "They sent a photo. Agree the price and date on WhatsApp, then set it here so their page updates." : "Agree the price and date on WhatsApp, then set it here so their page updates.",
          action: <Button onClick={onPrice} className="w-full">Set price</Button>,
        }
      : o.stage === 1 && !o.depositPaid
        ? {
            title: o.paymentSent ? `${o.name} says they’ve paid` : `Waiting for ${o.name}’s payment`,
            text: o.paymentSent
              ? `Check your bank app for ${formatNaira(o.paymentSent === "full" ? (o.price ?? 0) : deposit)} (${o.paymentSent === "full" ? "the full price" : "the 60% deposit"}). Once it’s there, confirm it and their page moves to “In progress”.`
              : `When ${formatNaira(deposit)} (the 60% deposit) or ${formatNaira(o.price ?? 0)} (the full price) shows in your bank app, confirm it here and their page moves to “In progress”.`,
            action: (
              <div className="flex flex-col gap-2.5">
                {o.paymentSent === "full" ? (
                  <Button className="w-full" onClick={() => confirm(true)} disabled={save.busy}>Payment received</Button>
                ) : (
                  <Button className="w-full" onClick={() => confirm(false)} disabled={save.busy}>Deposit received</Button>
                )}
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
                  <button type="button" className={linkClass} onClick={() => confirm(o.paymentSent !== "full")} disabled={save.busy}>
                    {o.paymentSent === "full" ? "It was the deposit" : "They paid in full"}
                  </button>
                  {o.paymentSent && (
                    <a href={message(`Hi ${o.name}! I haven’t seen your payment for ${o.id} yet. Could you check?`)} target="_blank" rel="noreferrer" className={linkClass}>
                      Not there yet?
                    </a>
                  )}
                </div>
              </div>
            ),
          }
        : o.stage <= 2
          ? {
              title: late ? `Tell ${o.name} about the delay` : `Send ${o.name} a progress photo`,
              text: late ? "It’s running late. A quick note and a photo of where it’s at keep them on side." : "One photo of the work saves an “any news?” message, and it shows on their page straight away.",
              action: (
                <div className="flex flex-col gap-2.5">
                  <Button onClick={onUpdate}>Post an update</Button>
                  <button type="button" className={linkClass} onClick={markReady} disabled={save.busy}>Or mark it as ready</button>
                </div>
              ),
            }
          : {
              title: `Book ${o.name}’s delivery`,
              text: "It’s ready. Pass their number to a rider, then mark it delivered.",
              action: <Button className="w-full" onClick={() => save.run(() => studioMarkDelivered(o.code))} disabled={save.busy}>Mark as delivered</Button>,
            };
  const urgent = late || (o.stage === 1 && !o.depositPaid && Boolean(o.paymentSent)) || o.dueTone === "soon";

  // How they want it to fit, their height and measurements, in one line for Mimi.
  const m = o.measurements;
  const sizes = m ? (["bust", "waist", "hips", "length"] as const).filter((k) => m[k]).map((k) => `${k[0].toUpperCase()}${k.slice(1)} ${m[k]}`) : [];
  const fit = [o.fit ? fitWords(o.fit) : "", o.height ? `${o.height} cm tall` : "", sizes.length ? `${sizes.join(", ")} cm` : ""].filter(Boolean);
  const rows: [string, string][] = [
    ["Size", o.size ?? (fit.length ? "Their fit" : "—")],
    ...(fit.length ? [["Fit", fit.join(" · ")] as [string, string]] : []),
    ["Colours", o.colours === "photo" ? "As in the photo" : o.colourNote || "To agree"],
    ["When", o.when],
    ["Delivery", `${o.area}, ${o.state}`],
  ];

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4">
        <Stepper stage={o.stage} />
        <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-3 text-[14px]">
          <span className="text-stone-500">{o.name} sees “{stages[o.stage].label}”</span>
          <Link href={`/t/${o.code}`} className={`${linkClass} shrink-0 whitespace-nowrap`}>View their page</Link>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[22px] border border-amber-200 bg-amber-50 p-5">
        <span className={`self-start rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${urgent ? "bg-amber-200 text-amber-900" : "bg-white text-amber-800"}`}>{urgent ? "Needs you" : "Suggested"}</span>
        <h3 className="font-serif text-[24px] leading-[1.15] text-balance">{next.title}</h3>
        <p className="text-[15px] leading-[1.5] text-stone-600">{next.text}</p>
        <div className="pt-1">{next.action}</div>
        <SaveError show={save.failed} />
      </section>

      <a href={message(`Hi ${o.name}! About your order ${o.id}…`)} target="_blank" rel="noreferrer" className={`${linkClass} self-center`}>
        <WhatsAppIcon size={16} /> Message {o.name}
      </a>

      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4">
        <h3 className="text-[15px] font-semibold">What they asked for</h3>
        <div className="flex items-center gap-3">
          {o.piece.image && (
            <span className="relative h-[75px] w-14 shrink-0 overflow-hidden rounded-[8px] bg-orange-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.piece.image} alt="" className="size-full object-cover" />
            </span>
          )}
          <span className="flex flex-col">
            <span className="text-[15px] font-semibold">{pieceName(o)}</span>
            <span className="text-[14px] text-stone-500">Requested {o.ago}</span>
          </span>
        </div>
        {o.voiceNote && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[14px] text-stone-500">Their voice note</span>
            <VoicePlayer url={o.voiceNote} whose="their" />
          </div>
        )}
        {o.description && <p className="border-l-2 border-stone-200 pl-3 text-[14px] leading-[1.5] text-stone-600">“{o.description}”</p>}
        {o.photos.length > 0 && (
          <div className="flex gap-2">
            {o.photos.slice(0, 4).map((src, i) => (
              <span key={i} className="relative h-20 w-[60px] overflow-hidden rounded-[8px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Their photo ${i + 1}`} className="size-full object-cover" />
              </span>
            ))}
          </div>
        )}
        <dl className="flex flex-col gap-2 border-t border-stone-100 pt-3 text-[15px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4"><dt className="text-stone-500">{k}</dt><dd className="text-right">{v}</dd></div>
          ))}
        </dl>
        {o.notes && (
          <div className="flex flex-col gap-1 border-t border-stone-100 pt-3">
            <span className="text-[14px] text-stone-500">Notes</span>
            <p className="text-[15px] leading-[1.5]">{o.notes}</p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-[22px] bg-white p-4 text-[15px]">
        <h3 className="pb-1 text-[15px] font-semibold">Money</h3>
        {o.price ? (
          <>
            <div className="flex justify-between"><span className="text-stone-500">Price</span><span>{formatNaira(o.price)}</span></div>
            {o.paidInFull ? (
              <div className="flex justify-between"><span className="text-stone-500">Paid in full</span><span>{formatNaira(o.price)} · received</span></div>
            ) : (
              <>
                <div className="flex justify-between"><span className="text-stone-500">Deposit (60%)</span><span>{formatNaira(deposit)} {o.depositPaid ? "· received" : "· not yet"}</span></div>
                <div className="flex justify-between border-t border-stone-100 pt-2"><span className="text-stone-500">Balance (40%), due when ready</span><span className="font-semibold">{formatNaira(o.price - deposit)}</span></div>
              </>
            )}
            {o.readyBy && <div className="flex justify-between"><span className="text-stone-500">Ready by</span><span>{o.readyBy}</span></div>}
          </>
        ) : (
          <div className="flex justify-between"><span className="text-stone-500">Price</span><span>Not set yet</span></div>
        )}
      </section>

      <section className="flex flex-col gap-1">
        <h3 className="text-[15px] font-semibold">Updates they can see · {o.updates.length}</h3>
        <ol className="flex flex-col">
          {o.updates.map((u, i) => (
            <li key={i} className="relative flex gap-3 pt-3">
              <span className="flex flex-col items-center">
                <span className={`mt-1 size-3 rounded-full ${i === o.updates.length - 1 ? "bg-amber-700 shadow-[0_0_0_4px_#fde68a]" : "bg-stone-900"}`} />
                {i < o.updates.length - 1 && <span className="mt-1 w-px flex-1 bg-stone-900" />}
              </span>
              <span className="flex flex-col pb-1">
                <span className="text-[15px] font-semibold">{stages[u.stage].label}</span>
                <span className="text-[13px] text-stone-500">{u.at}</span>
                <span className="text-[14px] text-stone-600">{u.note}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function OrderPanel({ o, onClose }: { o: Row; onClose: () => void }) {
  const [mode, setMode] = useState<"detail" | "price" | "update">("detail");
  const title = mode === "price" ? `Set ${o.name}’s price` : mode === "update" ? "Post an update" : `${o.name} · ${o.id}`;
  // Each view starts at its top, not wherever the last one was scrolled to.
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    body.current?.closest("[data-sheet-body]")?.scrollTo({ top: 0 });
  }, [mode]);

  return (
    <Sheet open onClose={onClose} title={title}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div ref={body} key={mode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          {mode === "price" ? (
            <SetPrice o={o} onDone={() => setMode("detail")} />
          ) : mode === "update" ? (
            <PostUpdate o={o} onDone={() => setMode("detail")} />
          ) : (
            <OrderDetail o={o} onPrice={() => setMode("price")} onUpdate={() => setMode("update")} />
          )}
        </motion.div>
      </AnimatePresence>
    </Sheet>
  );
}

/* ------------------------------- the page ------------------------------- */

export function StudioView({ orders, publicKey }: { orders: Row[]; publicKey: string }) {
  const router = useRouter();
  const hello = useGreeting();
  const [filter, setFilter] = useState<number | "all" | "late">("all");
  const [open, setOpen] = useState<string | null>(null);
  const rows = orders;

  // The header shows Mimi's initial only while she's signed in (components/site/header.tsx).
  useEffect(() => {
    document.documentElement.dataset.studio = "in";
    return () => {
      delete document.documentElement.dataset.studio;
    };
  }, []);

  const tasks = rows.filter((r) => r.stage <= 3 && (r.stage === 0 || r.dueTone !== "normal" || (r.stage === 1 && !r.depositPaid && r.paymentSent))).slice(0, 4);
  const shown = rows.filter((r) => (filter === "all" ? true : filter === "late" ? r.dueTone === "late" : r.stage === filter));
  const late = rows.filter((r) => r.dueTone === "late").length;
  const fresh = rows.filter((r) => r.stage === 0).length;
  const toCollect = rows.reduce((s, r) => s + (r.price && r.depositPaid && !r.paidInFull ? r.price - depositOf(r.price) : 0), 0);
  const current = rows.find((r) => r.id === open);

  const leave = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <div className="container-page pt-6 pb-24 lg:pt-12">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[34px] leading-none tracking-[-0.01em] lg:text-[48px]">{hello}</h1>
        <p className="text-[16px] text-stone-600 lg:text-[18px]">
          {rows.length === 0
            ? "No orders yet."
            : `${fresh === 1 ? "1 new request" : `${fresh} new requests`}${late ? `, and ${late === 1 ? "one order is" : `${late} orders are`} running late.` : "."}`}
        </p>
      </div>

      <div className="mt-6 lg:mt-7 lg:max-w-[353px]">
        <PingCard publicKey={publicKey} />
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 flex flex-col gap-2 rounded-[22px] bg-white p-6 lg:mt-8 lg:max-w-[560px]">
          <h2 className="font-serif text-[24px] leading-tight">Your orders show up here</h2>
          <p className="text-[15px] leading-[1.5] text-stone-600">
            When someone sends you a request from the site, it lands here with their photos, voice note and sizes. Set the price here and their page updates.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:mt-8 lg:grid-cols-4 lg:gap-4">
            {[
              ["New requests", fresh, "to answer", ""],
              ["Due this week", rows.filter((r) => r.dueTone === "soon").length, "orders", ""],
              ["Running late", late, late === 1 ? "order" : "orders", late ? "text-red-700" : ""],
              ["Still to collect", formatNaira(toCollect), "in balances", ""],
            ].map(([k, v, unit, cls]) => (
              <div key={k as string} className={`flex flex-col gap-1 rounded-[22px] bg-white p-4 lg:p-5 ${k === "Still to collect" || k === "Running late" ? "max-lg:hidden" : ""}`}>
                <span className="text-[13px] text-stone-500 lg:text-[14px]">{k}</span>
                <span className="flex items-baseline gap-1.5"><span className={`text-[28px] leading-none font-semibold ${cls}`}>{v}</span><span className="text-[13px] text-stone-500">{unit}</span></span>
              </div>
            ))}
          </div>

          {tasks.length > 0 && (
            <section className="mt-6 lg:hidden" aria-label="Needs you">
              <h2 className="mb-3 text-[16px] font-semibold">Needs you · {tasks.length}</h2>
              <ul className="flex flex-col gap-2">
                {tasks.map((t) => (
                  <li key={t.id}>
                    <button type="button" onClick={() => setOpen(t.id)} className="flex w-full cursor-pointer items-center gap-3 rounded-[22px] bg-white p-3.5 text-left transition-colors duration-150 hover:bg-orange-100/60">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-orange-100 font-serif text-[16px] text-amber-800">{t.name[0]}</span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[15px] font-semibold">{nextStep(t)}</span>
                        <span className="truncate text-[13px] text-stone-500">{pieceName(t)} · {t.ago}</span>
                      </span>
                      <ChevronIcon size={18} className="shrink-0 text-stone-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="no-scrollbar -mx-5 mt-7 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0">
            <Chip on={filter === "all"} onClick={() => setFilter("all")}>All · {rows.length}</Chip>
            {[0, 1, 2, 3].map((st) => (
              <Chip key={st} on={filter === st} onClick={() => setFilter(st)}>{stageName[st]} · {rows.filter((r) => r.stage === st).length}</Chip>
            ))}
            <Chip on={filter === "late"} onClick={() => setFilter("late")}>Late · {late}</Chip>
          </div>

          {/* Phone: rows */}
          <ul className="mt-4 flex flex-col gap-2 lg:hidden">
            {shown.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => setOpen(o.id)} className="flex w-full cursor-pointer items-center gap-3 rounded-[22px] bg-white p-3 text-left transition-colors duration-150 hover:bg-orange-100/60">
                  <span className="relative h-[58px] w-11 shrink-0 overflow-hidden rounded-[8px] bg-orange-100">
                    {o.piece.image && <Image src={o.piece.image} alt="" fill sizes="44px" className="object-cover" unoptimized={unoptimized(o.piece.image)} />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[15px] font-semibold">{o.name}</span>
                    <span className="truncate text-[14px] text-stone-500">{pieceName(o)}{o.size ? ` · ${o.size}` : ""}</span>
                  </span>
                  <span className={`text-right text-[13px] ${dueClass[o.dueTone]}`}>{o.due}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="mt-5 hidden overflow-hidden rounded-[22px] bg-white lg:block">
            <table className="w-full text-left text-[15px]">
              <thead className="bg-stone-50 text-[13px] text-stone-500">
                <tr>{["Order", "Customer", "Piece", "Stage", "Due", "Paid", "Next action"].map((h) => <th key={h} scope="col" className="px-5 py-3.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {shown.map((o) => (
                  <tr key={o.id} onClick={() => setOpen(o.id)} className={`cursor-pointer border-t border-stone-100 transition-colors hover:bg-orange-50 ${o.dueTone === "late" ? "bg-red-50/60" : ""}`}>
                    <td className="px-5 py-3.5 text-stone-500">{o.id}</td>
                    <td className="px-5 py-3.5 font-medium">{o.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-3">
                        <span className="relative h-[42px] w-8 shrink-0 overflow-hidden rounded-[8px] bg-orange-100">
                          {o.piece.image && <Image src={o.piece.image} alt="" fill sizes="32px" className="object-cover" unoptimized={unoptimized(o.piece.image)} />}
                        </span>
                        {pieceName(o)}{o.size ? ` · ${o.size}` : ""}
                      </span>
                    </td>
                    <td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${stageTone[o.stage]}`}>{stageName[o.stage]}</span></td>
                    <td className={`px-5 py-3.5 ${dueClass[o.dueTone]}`}>{o.due}</td>
                    <td className="px-5 py-3.5 text-stone-500">{o.stage === 0 ? "—" : o.depositPaid ? (o.paidInFull ? "In full" : "Deposit") : o.paymentSent ? "To check" : "Waiting"}</td>
                    <td className="px-5 py-3.5">
                      <button type="button" className="cursor-pointer font-semibold underline-offset-4 hover:underline">{nextStep(o)}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[13px] text-stone-500">Open an order to update it. Every change shows up on the customer’s tracking page.</p>
        </>
      )}

      <div className="mt-6 flex items-center gap-3 text-[14px] text-stone-500">
        <span>
          Signed in on this <span className="lg:hidden">phone</span>
          <span className="max-lg:hidden">computer</span>
        </span>
        <button type="button" onClick={leave} className={`${linkClass} text-[14px]`}>
          Sign out
        </button>
      </div>

      {current && <OrderPanel key={current.id} o={current} onClose={() => setOpen(null)} />}
    </div>
  );
}
