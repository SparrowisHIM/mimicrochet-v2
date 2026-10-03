"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { ChevronIcon } from "@/components/icons";
import { IdeasSheet } from "@/components/custom-order/ideas-sheet";
import { formatMeasure, MeasureSheet, measureSteps, type MeasureKey, type Measures } from "@/components/custom-order/measure-sheet";
import { SentView } from "@/components/custom-order/sent";
import { VoiceNote, type Voice } from "@/components/custom-order/voice-note";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { newOrderIds, nigerianStates, saveOrder, thumbnail, type Order } from "@/lib/orders";
import { pieceFromIdea, pieceFromProduct, type Piece } from "@/lib/pieces";
import { getProduct, type Product } from "@/lib/products";
import { sizeLabels } from "@/lib/sizes";

const ease = [0.22, 1, 0.36, 1] as const;

type Photo = { id: string; name: string; bytes: number; preview: string; file: File };

export type Draft = {
  photos: Photo[];
  voice?: Voice;
  piece?: Piece;
  words: string;
  size?: string;
  measures: Measures;
  unit: "cm" | "in";
  colours: "photo" | "different";
  colourNote: string;
  when: "none" | "date";
  date?: string;
  budget?: string;
  notes: string;
  name: string;
  phone: string;
  state: string;
  area: string;
  sizeOk: boolean;
};

const starter = ["red-fringe-beach-set", "royal-wave-crochet-shirt", "lilac-ruffle-tube-dress", "candy-bloom-ruffle-set", "monochrome-crochet-shirt", "noir-bloom-crochet-shirt", "heart-sweater", "sunflower-crop-cardigan"]
  .map((s) => getProduct(s))
  .filter(Boolean) as Product[];

const unsized = (p?: Piece) => p && !p.sized;


const fmtBytes = (n: number) => (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`);
const dateLabel = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const addDays = (from: number, d: number) => {
  const t = new Date(from);
  t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 10);
};

/* ----------------------------- small building blocks ----------------------------- */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[15px] font-semibold">{label}</span>
      {hint && <span className="-mt-1 text-[14px] text-stone-500">{hint}</span>}
      {children}
    </label>
  );
}
const inputClass =
  "h-[52px] w-full rounded-[14px] border border-stone-300 bg-white px-4 text-[16px] outline-none transition-[border-color,box-shadow] placeholder:text-stone-400 focus:border-stone-900 focus:shadow-[0_0_0_3px_rgb(28_25_23/0.08)]";

function Choice({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[16px] border bg-white px-4 py-3.5 text-left transition-[border-color,box-shadow] ${
        on ? "border-stone-900 shadow-[0_0_0_1px_var(--color-stone-900)]" : "border-stone-300 hover:border-stone-500"
      }`}
    >
      <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? "border-stone-900" : "border-stone-300"}`}>
        <motion.span className="size-2.5 rounded-full bg-stone-900" initial={false} animate={{ scale: on ? 1 : 0 }} transition={{ type: "spring", stiffness: 600, damping: 22 }} />
      </span>
      <span className="flex flex-col">
        <span className="text-[15px] font-medium">{label}</span>
        {hint && <span className="text-[13px] text-stone-500">{hint}</span>}
      </span>
    </button>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="relative h-1 flex-1 overflow-hidden rounded-full bg-stone-200">
          <motion.span
            className="absolute inset-0 origin-left rounded-full bg-stone-900"
            initial={false}
            animate={{ scaleX: i <= step ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
          />
          {i === step && (
            <motion.span
              key={step}
              className="absolute inset-y-0 w-10 bg-linear-to-r from-transparent via-white/70 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "700%" }}
              transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
            />
          )}
        </span>
      ))}
    </div>
  );
}

/* ----------------------------- the request summary ----------------------------- */

function useSummary(d: Draft) {
  const rows = [
    {
      key: "Piece",
      value: d.piece ? d.piece.name : d.photos.length ? `From your photo${d.photos.length > 1 ? "s" : ""}` : d.words.trim().length > 2 ? "Described in your words" : "",
    },
    {
      key: "Size",
      value: unsized(d.piece)
        ? "Agreed with Mimi"
        : Object.keys(d.measures).length
          ? `${d.size ? d.size + " + " : ""}your measurements`
          : d.size ?? "",
    },
    { key: "Colours", value: d.colours === "photo" ? "As in the photo" : d.colourNote.trim() ? d.colourNote.trim() : "" },
    { key: "When", value: d.when === "none" ? "No rush" : d.date ? `By ${dateLabel(d.date)}` : "" },
    { key: "Delivery", value: d.area.trim() && d.state ? `${d.area.trim()}, ${d.state}` : "" },
  ];
  return { rows, ready: rows.filter((r) => r.value).length };
}

function Summary({ draft, onEdit, compact }: { draft: Draft; onEdit?: () => void; compact?: boolean }) {
  const { rows, ready } = useSummary(draft);
  const reduce = useReducedMotion();
  const all = ready === rows.length;

  return (
    <div className="relative flex flex-col gap-1 rounded-[22px] border border-stone-200 bg-white p-5 lg:p-6">
      <div className="flex items-center justify-between pb-2">
        <span className="text-[16px] font-semibold">Your request</span>
        {onEdit ? (
          <button type="button" onClick={onEdit} className="text-[14px] font-medium underline underline-offset-4">
            Edit
          </button>
        ) : (
          <span className={`text-[13px] font-semibold text-stone-500 transition-opacity ${all ? "opacity-0" : ""}`}>
            {ready} of {rows.length} ready
          </span>
        )}
      </div>
      {!compact && (draft.piece || draft.photos[0]) && (
        <div className="mb-2 flex items-center gap-3">
          <span className="relative h-16 w-12 overflow-hidden rounded-[10px] bg-orange-100">
            <Image src={draft.piece?.image ?? draft.photos[0].preview} alt="" fill sizes="48px" className="object-cover" unoptimized={!draft.piece} />
          </span>
          <span className="flex flex-col">
            <span className="text-[15px] font-medium">{draft.piece?.name ?? "Your photo"}</span>
            <span className="text-[13px] text-stone-500">
              {draft.piece?.price ? `From ₦${draft.piece.price.toLocaleString("en-NG")} · Made to order` : "Price agreed on WhatsApp"}
            </span>
          </span>
        </div>
      )}
      <ul className="flex flex-col">
        {rows.map((r) => (
          <li key={r.key} className="relative flex items-center justify-between gap-4 border-t border-stone-100 py-2.5 text-[15px]">
            {/* A fresh key per value makes the row flash amber each time it's filled or changed. */}
            {r.value && !reduce && (
              <motion.span
                key={r.value}
                className="absolute -inset-x-2 inset-y-0.5 rounded-[8px] bg-amber-100"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.95 }}
                aria-hidden
              />
            )}
            <span className="relative flex items-center gap-2 text-stone-500">
              <motion.span
                className={`grid size-[18px] place-items-center rounded-full ${r.value ? "bg-emerald-600 text-white" : "border-[1.5px] border-dashed border-stone-300"}`}
                initial={false}
                animate={{ scale: r.value ? [0.6, 1.15, 1] : 1 }}
                transition={{ duration: 0.35 }}
              >
                {r.value && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </motion.span>
              {r.key}
            </span>
            <span className={`relative max-w-[60%] truncate text-right ${r.value ? "font-medium text-stone-900" : "text-stone-400"}`}>{r.value || "Still needed"}</span>
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {all && (
          <motion.div
            className="absolute -top-4 -right-3 grid size-[86px] place-items-center rounded-full border-2 border-emerald-700 bg-emerald-50 text-center text-[10px] leading-[1.15] font-bold tracking-[0.06em] text-emerald-800"
            initial={reduce ? { opacity: 0 } : { scale: 2.2, rotate: -28, opacity: 0 }}
            animate={{ scale: 1, rotate: -12, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 380, damping: 14 }}
            aria-label="Ready to send"
          >
            <span className="flex flex-col items-center gap-0.5">
              <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              READY
              <br />
              TO SEND
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------- sending moment ----------------------------- */

const checkpoints = ["Saving your request", "Creating your tracking link", "Writing your WhatsApp message"];

function Sending({ done }: { done: number }) {
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-stone-900/45 px-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        role="status"
        aria-live="polite"
        className="flex w-full max-w-[340px] flex-col items-center gap-5 rounded-[28px] bg-orange-50 px-6 py-8"
        initial={{ y: 40, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <span className="relative grid size-14 place-items-center">
          <motion.span className="absolute inset-0 rounded-full border-[3px] border-stone-200 border-t-amber-700" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }} />
          <span className="size-2.5 rounded-full bg-amber-700" />
        </span>
        <div className="text-center">
          <p className="font-serif text-[24px]">Sending to Mimi</p>
          <p className="text-[15px] text-stone-500">Just a second.</p>
        </div>
        <ul className="flex w-full flex-col gap-3">
          {checkpoints.map((c, i) => (
            <li key={c} className={`flex items-center gap-3 text-[15px] transition-colors ${i <= done ? "text-stone-900" : "text-stone-400"}`}>
              <span className={`grid size-5 place-items-center rounded-full ${i < done ? "bg-stone-900 text-white" : i === done ? "bg-amber-100" : "border border-stone-300"}`}>
                {i < done ? (
                  <motion.svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <motion.path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25 }} />
                  </motion.svg>
                ) : i === done ? (
                  <span className="size-2 rounded-full bg-amber-700" />
                ) : null}
              </span>
              {c}
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

/* ----------------------------- the flow ----------------------------- */

export function CustomOrderFlow({ initialPiece, initialSize }: { initialPiece?: Piece; initialSize?: string }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(initialPiece ? 1 : 0);
  const [dir, setDir] = useState(1);
  const [d, setD] = useState<Draft>({
    photos: [],
    piece: initialPiece,
    words: "",
    size: initialSize && sizeLabels.includes(initialSize as (typeof sizeLabels)[number]) ? initialSize : undefined,
    measures: {},
    unit: "cm",
    colours: "photo",
    colourNote: "",
    when: "none",
    notes: "",
    name: "",
    phone: "",
    state: "",
    area: "",
    sizeOk: false,
  });
  const set = (patch: Partial<Draft>) => setD((cur) => ({ ...cur, ...patch }));
  const [today] = useState(() => Date.now());
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [measuring, setMeasuring] = useState<MeasureKey | null>(null);
  const [sending, setSending] = useState<number | null>(null);
  const [sent, setSent] = useState<{ order: Order; files: File[] } | null>(null);
  const [tried, setTried] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);

  const hasSource = d.photos.length > 0 || Boolean(d.piece) || d.words.trim().length > 2 || Boolean(d.voice);
  const sizeDone = unsized(d.piece) || Boolean(d.size) || Object.keys(d.measures).length > 0;
  const step2Done = sizeDone && (d.colours === "photo" || d.colourNote.trim().length > 1) && (d.when === "none" || Boolean(d.date));
  const phoneOk = d.phone.replace(/\D/g, "").length >= 10;
  const step3Done = d.name.trim().length > 1 && phoneOk && Boolean(d.state) && d.area.trim().length > 1 && (unsized(d.piece) || d.sizeOk);
  const needsBudget = !d.piece || d.piece.price === null;
  const rush = d.when === "date" && d.date && new Date(d.date).getTime() - today < 14 * 86_400_000;

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    setTried(false);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  };

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const list = await Promise.all(
      [...files]
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, 6)
        .map(async (file) => ({ id: `${file.name}-${file.size}-${Math.random()}`, name: file.name, bytes: file.size, preview: await thumbnail(file), file })),
    );
    setD((cur) => ({ ...cur, photos: [...cur.photos, ...list].slice(0, 6) }));
  };

  const send = async () => {
    if (!step3Done) return setTried(true);
    setSending(0);
    const { id, code } = newOrderIds();
    const order: Order = {
      id,
      code,
      createdAt: new Date().toISOString(),
      piece: d.piece
        ? { name: d.piece.name, image: d.piece.image, slug: d.piece.slug, source: d.piece.source, price: d.piece.price }
        : { name: d.photos.length ? "From your photo" : "Your own idea", image: d.photos[0]?.preview, source: d.photos.length ? "photo" : "words" },
      photos: d.photos.map((p) => p.preview),
      hasVoiceNote: Boolean(d.voice),
      description: d.words.trim() || undefined,
      size: d.size,
      measurements: Object.keys(d.measures).length ? { ...d.measures, unit: d.unit } : undefined,
      colours: d.colours,
      colourNote: d.colourNote.trim() || undefined,
      when: d.when === "none" ? "No rush" : `By ${dateLabel(d.date!)}`,
      budget: needsBudget ? d.budget : undefined,
      notes: d.notes.trim() || undefined,
      name: d.name.trim(),
      phone: d.phone.trim(),
      state: d.state,
      area: d.area.trim(),
      stage: 0,
      updates: [{ stage: 0, note: "Request sent. Mimi will reply on WhatsApp.", at: "Today" }],
    };
    const wait = (ms: number) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
    saveOrder(order);
    await wait(500);
    setSending(1);
    await wait(500);
    setSending(2);
    await wait(500);
    setSending(3);
    await wait(250);
    setSending(null);
    setSent({ order, files: [...d.photos.map((p) => p.file), ...(d.voice ? [d.voice.file] : [])] });
    window.scrollTo({ top: 0 });
  };

  const variants = {
    enter: (dr: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: 48 * dr }),
    center: { opacity: 1, x: 0 },
    exit: (dr: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: -48 * dr }),
  };
  const item = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.42, ease } },
  };
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } } };

  if (sent) return <SentView order={sent.order} files={sent.files} />;

  const title = ["What should Mimi make?", "Make it yours", "Where can Mimi reach you?"][step];
  const lead = [
    "Start with a photo, one of Mimi’s pieces, or your own words. There’s no payment now.",
    "Mimi uses this to price your piece and plan the timeline.",
    "She’ll message you on WhatsApp to agree the price. Nothing is charged today.",
  ][step];

  const nextDisabled = step === 0 ? !hasSource : step === 1 ? !step2Done : false;

  return (
    <div ref={top} className="scroll-mt-20">
      <div className="container-page flex flex-col gap-3 pt-5 lg:pt-8">
        <div className="flex items-center justify-between text-[14px]">
          <span className="font-medium text-stone-500">Custom order · Step {step + 1} of 3</span>
          <Link href="/" className="font-medium underline underline-offset-4">
            Exit
          </Link>
        </div>
        <Progress step={step} />
      </div>

      <div className="container-page flex gap-16 pt-7 pb-36 lg:pt-12 lg:pb-24">
        <div className="min-w-0 flex-1 lg:max-w-[640px]">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.42, ease }}>
              <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-7">
                {step === 1 && d.piece && (
                  <motion.div variants={item} className="flex items-center gap-3 rounded-[18px] bg-white p-3 pr-4">
                    <span className="relative h-20 w-[60px] shrink-0 overflow-hidden rounded-[10px] bg-orange-100">
                      <Image src={d.piece.image} alt="" fill sizes="60px" className="object-cover" />
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-[15px] font-medium">{d.piece.name}</span>
                      <span className="text-[14px] text-stone-500">
                        {d.piece.price ? `From ₦${d.piece.price.toLocaleString("en-NG")}` : "Price on request"} · {d.piece.source === "idea" ? "Idea" : "Made to order"}
                      </span>
                    </span>
                    <button type="button" onClick={() => go(0)} className="text-[14px] font-medium underline underline-offset-4">
                      Change
                    </button>
                  </motion.div>
                )}

                <motion.div variants={item} className="flex flex-col gap-2.5">
                  <h1 className="font-serif text-[32px] leading-[1.08] tracking-[-0.01em] lg:text-[48px]">{title}</h1>
                  <p className="text-[16px] leading-[1.5] text-stone-600 lg:text-[18px]">{lead}</p>
                </motion.div>

                {step === 0 && (
                  <>
                    <motion.div variants={item} className="flex flex-col gap-3">
                      <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                      {d.photos.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => fileInput.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                          className="group flex flex-col items-center gap-2 rounded-[22px] border-[1.5px] border-dashed border-stone-300 bg-white px-6 py-8 text-center transition-colors hover:border-stone-900"
                        >
                          <span className="grid size-12 place-items-center rounded-full bg-orange-100 text-[26px] leading-none transition-transform group-hover:scale-110">+</span>
                          <span className="text-[17px] font-semibold">Add a photo</span>
                          <span className="max-w-[300px] text-[14px] text-stone-500">A screenshot, a Pinterest pin, or a photo of something you love.</span>
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          <span className="text-[15px] font-semibold">Your photos</span>
                          <AnimatePresence initial={false}>
                            {d.photos.map((p, i) => (
                              <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, x: 30 }}
                                transition={{ duration: 0.35, ease }}
                                className="flex items-center gap-3 rounded-[16px] bg-white p-2.5 pr-4"
                              >
                                <span className="relative size-12 shrink-0 overflow-hidden rounded-[10px]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={p.preview} alt="" className="size-full object-cover" />
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col">
                                  <span className="flex items-center gap-2">
                                    <span className="truncate text-[15px] font-medium">{p.name}</span>
                                    {i === 0 && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[12px] font-semibold text-amber-800">Main</span>}
                                  </span>
                                  <span className="text-[13px] text-stone-500">{fmtBytes(p.bytes)}</span>
                                </span>
                                <button type="button" onClick={() => set({ photos: d.photos.filter((x) => x.id !== p.id) })} className="text-[14px] underline underline-offset-2">
                                  Remove
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          {d.photos.length < 6 && (
                            <button type="button" onClick={() => fileInput.current?.click()} className="flex h-12 items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-stone-300 text-[15px] font-medium hover:border-stone-900">
                              + Add another photo
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>

                    {d.photos.length === 0 && (
                      <motion.div variants={item} className="flex flex-col gap-3">
                        <span className="text-[15px] font-semibold">Or start from one of Mimi’s pieces</span>
                        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 lg:mx-0 lg:px-0">
                          {starter.map((p) => {
                            const on = d.piece?.slug === p.slug;
                            return (
                              <button key={p.slug} type="button" aria-pressed={on} onClick={() => set({ piece: on ? undefined : pieceFromProduct(p) })} className="flex w-[120px] shrink-0 flex-col gap-2 text-left">
                                <span className={`relative block aspect-[3/4] overflow-hidden rounded-[14px] bg-orange-100 transition-shadow ${on ? "ring-[2.5px] ring-stone-900 ring-offset-2 ring-offset-orange-50" : ""}`}>
                                  <Image src={p.images[0]} alt="" fill sizes="120px" className="object-cover" />
                                  <AnimatePresence>
                                    {on && (
                                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-stone-900 text-white">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </span>
                                <span className="text-[14px] leading-tight font-medium">{p.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    <motion.button variants={item} type="button" onClick={() => setIdeasOpen(true)} className="flex items-center gap-3 rounded-[18px] bg-white p-3 pr-4 text-left">
                      <span className="flex -space-x-3">
                        {["/images/ideas/daisy-ruffle-crochet-set.jpg", "/images/ideas/carnival-granny-crochet-shirt.jpg", "/images/ideas/azure-bloom-granny-bucket-hat.jpg"].map((s) => (
                          <span key={s} className="relative h-12 w-9 overflow-hidden rounded-[8px] border-2 border-white">
                            <Image src={s} alt="" fill sizes="36px" className="object-cover" />
                          </span>
                        ))}
                      </span>
                      <span className="flex flex-1 flex-col">
                        <span className="text-[15px] font-semibold">{d.piece?.source === "idea" ? `Idea: ${d.piece.name}` : "Need ideas?"}</span>
                        <span className="text-[13px] text-stone-500">Concepts, or search Pinterest</span>
                      </span>
                      <ChevronIcon size={20} />
                    </motion.button>

                    <motion.div variants={item} className="flex flex-col gap-3 rounded-[22px] border border-stone-300 bg-white p-4 focus-within:border-stone-900">
                      <label className="sr-only" htmlFor="describe">Describe it</label>
                      <textarea
                        id="describe"
                        rows={3}
                        value={d.words}
                        onChange={(e) => set({ words: e.target.value })}
                        placeholder={d.photos.length ? "Anything to add? Type it here." : "Or tell Mimi in your own words: the piece, colours, the occasion…"}
                        className="w-full resize-none bg-transparent text-[16px] leading-[1.5] outline-none placeholder:text-stone-400"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <button type="button" onClick={() => fileInput.current?.click()} className="grid size-10 place-items-center rounded-full bg-orange-50 text-[22px] leading-none hover:bg-orange-100" aria-label="Add a photo">
                          +
                        </button>
                        <VoiceNote value={d.voice} onChange={(voice) => set({ voice })} />
                      </div>
                    </motion.div>
                  </>
                )}

                {step === 1 && (
                  <>
                    {!unsized(d.piece) && (
                      <motion.div variants={item} className="flex flex-col gap-3">
                        <span className="text-[15px] font-semibold">Size</span>
                        <div className="flex gap-2" role="radiogroup" aria-label="Size">
                          {sizeLabels.map((s) => (
                            <Chip key={s} on={d.size === s} onClick={() => set({ size: d.size === s ? undefined : s, sizeOk: false })} className="flex-1 justify-center lg:flex-none lg:px-6">
                              {s}
                            </Chip>
                          ))}
                        </div>
                        <div className="flex flex-col gap-3 rounded-[18px] bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <span className="flex flex-col">
                              <span className="text-[15px] font-semibold">Not sure of your size?</span>
                              <span className="text-[13px] text-stone-500">Add your measurements and Mimi uses them instead.</span>
                            </span>
                            <span className="flex shrink-0 gap-0.5 rounded-full bg-orange-100 p-[3px]">
                              {(["cm", "in"] as const).map((u) => (
                                <button key={u} type="button" onClick={() => set({ unit: u })} aria-pressed={d.unit === u} className={`rounded-full px-3 py-1 text-[13px] ${d.unit === u ? "bg-stone-900 font-semibold text-orange-50" : "text-stone-600"}`}>
                                  {u}
                                </button>
                              ))}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            {measureSteps.map((m) => {
                              const v = d.measures[m.key];
                              return (
                                <button key={m.key} type="button" onClick={() => setMeasuring(m.key)} className="flex flex-col gap-1.5 text-left">
                                  <span className="text-[13px] font-medium text-stone-600">{m.label}</span>
                                  <span className={`flex h-12 items-center justify-between rounded-[12px] border px-3.5 text-[16px] ${v ? "border-stone-900 font-medium" : "border-stone-300 text-stone-400"}`}>
                                    {v ? formatMeasure(v, d.unit) : "Add"}
                                    <span className="text-[13px] text-stone-400">{d.unit}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[13px] text-stone-500">Tip: measure a top or dress that already fits you well, laid flat.</p>
                        </div>
                      </motion.div>
                    )}

                    <motion.div variants={item} className="flex flex-col gap-2.5" role="radiogroup" aria-label="Colours">
                      <span className="text-[15px] font-semibold">Colours</span>
                      <Choice on={d.colours === "photo"} onClick={() => set({ colours: "photo" })} label="As in the photo" hint={d.piece ? "Like the piece you picked" : undefined} />
                      <Choice on={d.colours === "different"} onClick={() => set({ colours: "different" })} label="Different colours" hint="Tell Mimi which colours you’d like" />
                      <AnimatePresence initial={false}>
                        {d.colours === "different" && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <input autoFocus value={d.colourNote} onChange={(e) => set({ colourNote: e.target.value })} placeholder="e.g. lilac and white" className={`${inputClass} mt-1`} aria-label="Which colours" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.div variants={item} className="flex flex-col gap-3">
                      <span className="text-[15px] font-semibold">When do you need it?</span>
                      <div className="flex gap-2">
                        <Chip on={d.when === "none"} onClick={() => set({ when: "none" })}>No rush</Chip>
                        <Chip on={d.when === "date"} onClick={() => set({ when: "date", date: d.date ?? addDays(today, 21) })}>By a date</Chip>
                      </div>
                      <AnimatePresence initial={false}>
                        {d.when === "date" && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="flex flex-col gap-3 rounded-[18px] bg-white p-4">
                              <div className="flex flex-wrap gap-2">
                                {[["In 2 weeks", 14], ["In 3 weeks", 21], ["In a month", 30]].map(([l, n]) => (
                                  <Chip key={l} on={d.date === addDays(today, n as number)} onClick={() => set({ date: addDays(today, n as number) })}>{l}</Chip>
                                ))}
                              </div>
                              <input type="date" min={addDays(today, 5)} value={d.date ?? ""} onChange={(e) => set({ date: e.target.value })} className={inputClass} aria-label="Pick a date" />
                              {d.date && <p className="text-[14px] font-medium">Ready by {dateLabel(d.date)}</p>}
                              {rush && <p className="rounded-[12px] bg-amber-100 px-3 py-2 text-[13px] text-amber-800">Under two weeks counts as a rush order. Rush orders cost about ₦20–30k more.</p>}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {needsBudget && (
                      <motion.div variants={item} className="flex flex-col gap-3">
                        <span className="text-[15px] font-semibold">Your budget <span className="font-normal text-stone-500">(optional)</span></span>
                        <div className="flex flex-wrap gap-2">
                          {["Under ₦30k", "₦30k–60k", "₦60k–100k", "Over ₦100k"].map((b) => (
                            <Chip key={b} on={d.budget === b} onClick={() => set({ budget: d.budget === b ? undefined : b })}>{b}</Chip>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <motion.div variants={item}>
                      <Field label="Anything else? (optional)">
                        <textarea rows={3} value={d.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Length, neckline, the occasion…" className={`${inputClass} h-auto py-3.5 leading-[1.5]`} />
                      </Field>
                    </motion.div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <motion.div variants={item} className="flex flex-col gap-5">
                      <Field label="Your name">
                        <input autoComplete="name" value={d.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} aria-invalid={tried && d.name.trim().length < 2} />
                      </Field>
                      <Field label="WhatsApp number" hint="Mimi messages you here to agree the price.">
                        <input type="tel" autoComplete="tel" inputMode="tel" placeholder="+234 801 234 5678" value={d.phone} onChange={(e) => set({ phone: e.target.value })} className={inputClass} aria-invalid={tried && !phoneOk} />
                        {tried && !phoneOk && <span className="text-[13px] text-red-700">Add a full phone number so Mimi can reach you.</span>}
                      </Field>
                    </motion.div>
                    <motion.div variants={item} className="flex flex-col gap-4">
                      <div className="flex flex-col">
                        <span className="text-[15px] font-semibold">Delivery address</span>
                        <span className="text-[14px] text-stone-500">Mimi delivers anywhere in Nigeria. You pay the rider on arrival.</span>
                      </div>
                      <Field label="State">
                        <select value={d.state} onChange={(e) => set({ state: e.target.value })} className={`${inputClass} appearance-none`} aria-invalid={tried && !d.state}>
                          <option value="">Choose your state</option>
                          {nigerianStates.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Area or town">
                        <input autoComplete="address-level2" placeholder="e.g. GRA Phase 2, Port Harcourt" value={d.area} onChange={(e) => set({ area: e.target.value })} className={inputClass} aria-invalid={tried && d.area.trim().length < 2} />
                      </Field>
                    </motion.div>
                    <motion.div variants={item} className="lg:hidden">
                      <Summary draft={d} onEdit={() => go(1)} />
                    </motion.div>
                    {!unsized(d.piece) && (
                      <motion.label variants={item} className={`flex cursor-pointer gap-3 rounded-[18px] border bg-white p-4 ${tried && !d.sizeOk ? "border-red-400" : "border-transparent"}`}>
                        <input type="checkbox" checked={d.sizeOk} onChange={(e) => set({ sizeOk: e.target.checked })} className="mt-0.5 size-5 shrink-0 accent-stone-900" />
                        <span className="flex flex-col gap-1">
                          <span className="text-[15px] font-semibold">My size is right{d.size ? ` (${d.size})` : ""}</span>
                          <span className="text-[13px] leading-[1.45] text-stone-500">Mimi makes the piece to the size or measurements I gave. If they’re wrong, it can’t be remade for free.</span>
                        </span>
                      </motion.label>
                    )}
                    <motion.p variants={item} className="text-[14px] text-stone-500">No payment now. Mimi confirms the price with you on WhatsApp before she starts.</motion.p>
                  </>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="hidden w-[400px] shrink-0 lg:block">
          <div className="sticky top-28">
            <Summary draft={d} compact={false} />
          </div>
        </aside>
      </div>

      {/* Action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200/70 bg-orange-50/95 backdrop-blur-md">
        <div className="container-page flex items-center gap-3 py-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:justify-end">
          {step > 0 && (
            <button type="button" onClick={() => go(step - 1)} className="px-2 text-[16px] font-semibold underline underline-offset-4">
              Back
            </button>
          )}
          {step < 2 ? (
            <Button className="flex-1 lg:w-[240px] lg:flex-none" disabled={nextDisabled} onClick={() => go(step + 1)}>
              Continue
            </Button>
          ) : (
            <Button className="flex-1 lg:w-[240px] lg:flex-none" onClick={send}>
              Send to Mimi
            </Button>
          )}
        </div>
      </div>

      <IdeasSheet
        open={ideasOpen}
        onClose={() => setIdeasOpen(false)}
        onPick={(idea) => {
          set({ piece: pieceFromIdea(idea) });
          setIdeasOpen(false);
        }}
      />
      {measuring && (
        <MeasureSheet
          open
          startAt={measuring}
          values={d.measures}
          unit={d.unit}
          onUnit={(unit) => set({ unit })}
          onSave={(key, cm) => setD((cur) => ({ ...cur, measures: { ...cur.measures, [key]: cm }, sizeOk: false }))}
          onClose={() => setMeasuring(null)}
        />
      )}
      <AnimatePresence>{sending !== null && <Sending done={sending} />}</AnimatePresence>
    </div>
  );
}

