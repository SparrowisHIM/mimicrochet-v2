"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { ChevronIcon } from "@/components/icons";
import { IdeasSheet } from "@/components/custom-order/ideas-sheet";
import { formatMeasure, MeasureSheet, measureSteps, type MeasureKey, type Measures } from "@/components/custom-order/measure-sheet";
import { SendingMoment } from "@/components/custom-order/sending";
import { SentView } from "@/components/custom-order/sent";
import { VoiceNote, type Voice } from "@/components/custom-order/voice-note";
import { DatePicker, shortDate } from "@/components/form/date-picker";
import { Check, Field, inputClass, NameInput, PhoneInput, useNudge } from "@/components/form/fields";
import { AreaPicker, StatePicker } from "@/components/form/place-picker";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { isLgaOf } from "@/lib/nigeria";
import { isRequestDate } from "@/lib/request-date";
import { newOrderIds, saveOrder, thumbnail, type Order } from "@/lib/orders";
import { pieceFromIdea, pieceFromProduct, type Piece } from "@/lib/pieces";
import { getProduct, type Product } from "@/lib/products";
import { sizeLabels } from "@/lib/sizes";
import { formatPhone, fullPhone, hasWords, isName, phoneDigits, phoneProblem } from "@/lib/validate";

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
  /** Nothing is chosen for you: these start empty until the customer picks. */
  colours?: "photo" | "different";
  colourNote: string;
  when?: "none" | "date";
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

/* ----------------------------- small building blocks ----------------------------- */

function Choice({ on, onClick, label, hint, invalid }: { on: boolean; onClick: () => void; label: string; hint?: string; invalid?: boolean }) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={`flex w-full items-center gap-3 rounded-[16px] border bg-white px-4 py-3.5 text-left transition-[border-color,box-shadow] ${
        on ? "border-stone-900 shadow-[0_0_0_1px_var(--color-stone-900)]" : invalid ? "border-red-400" : "border-stone-300 hover:border-stone-500"
      }`}
    >
      <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? "border-stone-900" : "border-stone-300"}`}>
        <motion.span className="size-2.5 rounded-full bg-stone-900" initial={false} animate={{ scale: on ? 1 : 0 }} transition={{ type: "spring", stiffness: 600, damping: 22 }} />
      </span>
      <span className="flex flex-col">
        <span className="text-[15px] font-medium">{label}</span>
        {hint && <span className="text-[13px] text-stone-500">{hint}</span>}
      </span>
    </motion.button>
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

/** A section the summary can jump to; it glows for a moment when you land on it. */
function Spot({ id, flash, className = "", children }: { id: string; flash: { id: string; n: number } | null; className?: string; children: React.ReactNode }) {
  return (
    <div id={id} className={`relative scroll-mt-28 ${className}`}>
      {flash?.id === id && (
        <motion.span
          key={flash.n}
          className="pointer-events-none absolute -inset-2.5 rounded-[22px] bg-amber-100/60 ring-2 ring-amber-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.6, times: [0, 0.12, 0.6, 1] }}
          aria-hidden
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      role="alert"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 text-[13px] font-medium text-red-700"
    >
      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-red-600 text-[10px] font-bold text-white" aria-hidden>
        !
      </span>
      {children}
    </motion.p>
  );
}

/* ----------------------------- the request summary ----------------------------- */

type RowState = "done" | "todo" | "warn";
type Row = { key: string; value: string; state: RowState; step: number; field: string };
const groups = ["The idea", "Make it yours", "You"];

function StatusDot({ state }: { state: RowState }) {
  return (
    <motion.span
      className={`grid size-[18px] shrink-0 place-items-center rounded-full ${
        state === "done" ? "bg-emerald-600 text-white" : state === "warn" ? "bg-amber-500 text-white" : "border-[1.5px] border-dashed border-stone-300"
      }`}
      initial={false}
      animate={{ scale: state === "todo" ? 1 : [0.5, 1.2, 1] }}
      transition={{ duration: 0.35 }}
    >
      {state === "done" ? <Check /> : state === "warn" ? <span className="text-[11px] leading-none font-bold">!</span> : null}
    </motion.span>
  );
}

function Summary({ draft, rows, step, onJump, compact }: { draft: Draft; rows: Row[]; step: number; onJump: (r: Row) => void; compact?: boolean }) {
  const reduce = useReducedMotion();
  const ready = rows.filter((r) => r.state === "done").length;
  const all = ready === rows.length && (unsized(draft.piece) || draft.sizeOk);

  return (
    <div className="relative flex flex-col gap-1 rounded-[24px] border border-stone-200 bg-stone-50 p-2 shadow-[0_24px_60px_-36px_rgb(28_25_23/0.4)]">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span className="text-[16px] font-semibold">Your request</span>
        <motion.span
          className="rounded-[8px] bg-amber-100 px-2 py-1 text-[13px] font-semibold text-amber-800 tabular-nums"
          animate={{ opacity: all ? 0 : 1 }}
        >
          {ready} of {rows.length}
        </motion.span>
      </div>
      {!compact && (draft.piece || draft.photos[0]) && (
        <div className="mx-1 mb-1 flex items-center gap-3 rounded-[16px] bg-white p-2.5">
          <span className="relative h-16 w-12 overflow-hidden rounded-[10px] bg-orange-100">
            <Image src={draft.piece?.image ?? draft.photos[0].preview} alt="" fill sizes="48px" className="object-cover" unoptimized={!draft.piece} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] font-medium">{draft.piece?.name ?? "Your photo"}</span>
            <span className="text-[13px] text-stone-500">{draft.piece?.price ? `From ₦${draft.piece.price.toLocaleString("en-NG")}, made to order` : "Price agreed on WhatsApp"}</span>
          </span>
        </div>
      )}

      {groups.map((g, gi) => {
        const items = rows.filter((r) => r.step === gi);
        const here = gi === step;
        return (
          <div key={g} className="flex flex-col">
            <span className="flex items-center gap-2 px-3 pt-3 pb-1.5 text-[12px] font-medium text-stone-400">
              {g}
              <span className="h-px flex-1 border-t border-dashed border-stone-200" aria-hidden />
            </span>
            <div className={`relative flex flex-col rounded-[14px] transition-colors duration-300 ${here ? "border border-stone-200 bg-white shadow-[0_1px_2px_rgb(28_25_23/0.06)]" : "border border-transparent"}`}>
              {here && <motion.span layoutId="summary-here" className="absolute top-3 bottom-3 left-0 w-[2.5px] rounded-full bg-stone-900" aria-hidden />}
              {items.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => onJump(r)}
                  className="group relative flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left text-[15px] transition-colors hover:bg-stone-100/70"
                  aria-label={`${r.key}: ${r.value || "still needed"}. Change`}
                >
                  {/* A fresh key per value makes the row flash amber each time it's filled or changed. */}
                  {r.value && !reduce && (
                    <motion.span
                      key={r.value}
                      className="absolute inset-0.5 rounded-[10px] bg-amber-100"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.95 }}
                      aria-hidden
                    />
                  )}
                  <span className="relative">
                    <StatusDot state={r.state} />
                  </span>
                  <span className="relative text-stone-500">{r.key}</span>
                  <span
                    className={`relative ml-auto max-w-[58%] truncate text-right ${
                      r.state === "done" ? "font-medium text-stone-900" : r.state === "warn" ? "font-medium text-amber-800" : "text-stone-400"
                    }`}
                  >
                    {r.value || "Still needed"}
                  </span>
                  <ChevronIcon size={16} className="relative shrink-0 text-stone-300 transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-stone-900" />
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <p className="px-3 pt-2 pb-2 text-[12px] text-stone-400">Tap any line to change it.</p>

      <AnimatePresence>
        {all && (
          <motion.div
            className="absolute -top-5 -right-3 grid size-[92px] place-items-center rounded-full border-2 border-emerald-700 bg-emerald-50 text-center text-[13px] leading-[1.1] font-semibold text-emerald-800 shadow-[0_10px_24px_-10px_rgb(4_120_87/0.5)]"
            initial={reduce ? { opacity: 0 } : { scale: 2.4, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: -12, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.6, rotate: 10 }}
            transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 380, damping: 14 }}
            role="status"
          >
            <span className="flex flex-col items-center gap-1">
              <Check size={16} />
              Ready
              <br />
              to send
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
    colourNote: "",
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
  const [sending, setSending] = useState<{ order: Order; files: File[] } | null>(null);
  const [sent, setSent] = useState<{ order: Order; files: File[] } | null>(null);
  const [tried, setTried] = useState(0);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [flash, setFlash] = useState<{ id: string; n: number } | null>(null);
  const [nameNudge, nudgeName] = useNudge();
  const [phoneNudge, nudgePhone] = useNudge();
  const fileInput = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);

  /* What's done, step by step. Nothing counts until the customer chooses it. */
  const hasVisual = d.photos.length > 0 || Boolean(d.piece);
  const hasSource = hasVisual || hasWords(d.words, 4) || Boolean(d.voice);
  const sizeDone = unsized(d.piece) || Boolean(d.size) || Object.keys(d.measures).length > 0;
  const coloursDone = d.colours === "photo" || (d.colours === "different" && hasWords(d.colourNote, 3));
  const whenDone = d.when === "none" || (d.when === "date" && isRequestDate(d.date, today));
  const step2Done = sizeDone && coloursDone && whenDone;
  const nameOk = isName(d.name);
  const phoneErr = phoneProblem(d.phone);
  const placeOk = isLgaOf(d.state, d.area);
  const sizeConfirmed = unsized(d.piece) || d.sizeOk;
  const step3Done = nameOk && !phoneErr && placeOk && sizeConfirmed;
  const firstOpen = !hasSource ? 0 : !step2Done ? 1 : !step3Done ? 2 : 3;
  const needsBudget = !d.piece || d.piece.price === null;
  const show = (field: string) => tried > 0 || touched[field];

  const firstMissing = (s: number) =>
    s === 0
      ? "f-source"
      : s === 1
        ? !sizeDone ? "f-size" : !coloursDone ? "f-colours" : "f-when"
        : !nameOk ? "f-name" : phoneErr ? "f-phone" : !placeOk ? "f-place" : "f-sizeok";

  const rows: Row[] = [
    {
      key: "Piece",
      step: 0,
      field: "f-source",
      value: d.piece ? d.piece.name : d.photos.length ? `From your photo${d.photos.length > 1 ? "s" : ""}` : hasWords(d.words, 4) ? "In your words" : d.voice ? "Your voice note" : "",
      state: hasSource ? "done" : "todo",
    },
    {
      key: "Size",
      step: 1,
      field: "f-size",
      value: unsized(d.piece) ? "Agreed with Mimi" : Object.keys(d.measures).length ? `${d.size ? d.size + " + " : ""}your measurements` : d.size ?? "",
      state: sizeDone ? "done" : "todo",
    },
    {
      key: "Colours",
      step: 1,
      field: "f-colours",
      value: d.colours === "photo" ? (hasVisual ? "As in the photo" : "Mimi’s choice") : d.colours === "different" ? (hasWords(d.colourNote, 3) ? d.colourNote.trim() : "Name the colours") : "",
      state: coloursDone ? "done" : d.colours ? "warn" : "todo",
    },
    {
      key: "When",
      step: 1,
      field: "f-when",
      value: d.when === "none" ? "No rush" : d.when === "date" ? (d.date ? `By ${shortDate(d.date)}` : "Pick a date") : "",
      state: whenDone ? "done" : d.when ? "warn" : "todo",
    },
    {
      key: "You",
      step: 2,
      field: !nameOk && d.name ? "f-name" : phoneErr && d.phone ? "f-phone" : !nameOk ? "f-name" : "f-phone",
      value:
        nameOk && !phoneErr
          ? `${d.name.trim().split(" ")[0]}, 0${formatPhone(phoneDigits(d.phone))}`
          : d.phone && phoneErr
            ? "Check your number"
            : d.name && !nameOk
              ? "Check your name"
              : nameOk
                ? "Add your number"
                : d.phone
                  ? "Add your name"
                  : "",
      state: nameOk && !phoneErr ? "done" : d.name || d.phone ? "warn" : "todo",
    },
    {
      key: "Delivery",
      step: 2,
      field: "f-place",
      value: placeOk ? `${d.area}, ${d.state}` : d.state ? "Choose your area" : "",
      state: placeOk ? "done" : d.state ? "warn" : "todo",
    },
  ];

  const focusField = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    const target =
      id === "f-place" && d.state
        ? document.getElementById("area")
        : ["input:not([type=file]):not([type=hidden])", "textarea", "button[aria-haspopup]", "button[role=radio]", "button"].map((q) => el.querySelector<HTMLElement>(q)).find(Boolean);
    target?.focus({ preventScroll: true });
    setFlash((f) => ({ id, n: (f?.n ?? 0) + 1 }));
  };

  const go = (next: number, then?: string) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    setTried(0);
    if (then) setTimeout(() => focusField(then), reduce ? 60 : 520);
    else requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  };

  /** From the summary: go straight to a line, unless an earlier step still needs something. */
  const jump = (r: Row) => {
    const to = r.step;
    const field = r.field;
    if (to === step) focusField(field);
    else go(to, field);
  };

  const next = () => {
    const done = step === 0 ? hasSource : step2Done;
    if (!done) {
      setTried((t) => t + 1);
      focusField(firstMissing(step));
      return;
    }
    go(step + 1);
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

  const send = () => {
    if (sending) return;
    if (d.when === "date" && !isRequestDate(d.date, Date.now())) {
      go(1, "f-when");
      setTried((t) => t + 1);
      return;
    }
    if (firstOpen < 3) {
      if (firstOpen < 2) return go(firstOpen, firstMissing(firstOpen));
      setTried((t) => t + 1);
      return focusField(firstMissing(2));
    }
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
      colours: d.colours!,
      colourNote: d.colours === "different" ? d.colourNote.trim() : undefined,
      when: d.when === "date" && d.date ? `By ${shortDate(d.date)}` : "No rush",
      budget: needsBudget ? d.budget : undefined,
      notes: d.notes.trim() || undefined,
      name: d.name.trim(),
      phone: fullPhone(phoneDigits(d.phone)),
      state: d.state,
      area: d.area,
      stage: 0,
      updates: [{ stage: 0, note: "Request prepared. Send the details to Mimi on WhatsApp to confirm.", at: "Today" }],
    };
    saveOrder(order);
    setSending({ order, files: [...d.photos.map((p) => p.file), ...(d.voice ? [d.voice.file] : [])] });
  };

  const variants = {
    enter: (dr: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: 60 * dr, filter: "blur(6px)" }),
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: (dr: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: -60 * dr, filter: "blur(6px)" }),
  };
  const item = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 26 } },
  };
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };

  const title = ["What should Mimi make?", "Make it yours", "Where can Mimi reach you?"][step];
  const lead = [
    "Start with a photo, one of Mimi’s pieces, or your own words. There’s no payment now.",
    "Mimi uses this to price your piece and plan the timeline.",
    "She’ll message you on WhatsApp to agree the price. Nothing is charged today.",
  ][step];

  const flow = (
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
            <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.38, ease }}>
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
                  <Spot id="f-source" flash={flash} className="flex flex-col gap-7">
                    <motion.div variants={item} className="flex flex-col gap-3">
                      <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                      {d.photos.length === 0 ? (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.985 }}
                          onClick={() => fileInput.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                          className="group flex flex-col items-center gap-2 rounded-[22px] border-[1.5px] border-dashed border-stone-300 bg-white px-6 py-8 text-center transition-colors hover:border-stone-900"
                        >
                          <span className="grid size-12 place-items-center rounded-full bg-orange-100 text-[26px] leading-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90">+</span>
                          <span className="text-[17px] font-semibold">Add a photo</span>
                          <span className="max-w-[300px] text-[14px] text-stone-500">A screenshot, a Pinterest pin, or a photo of something you love.</span>
                        </motion.button>
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
                              <motion.button key={p.slug} type="button" whileTap={{ scale: 0.96 }} aria-pressed={on} onClick={() => set({ piece: on ? undefined : pieceFromProduct(p) })} className="flex w-[120px] shrink-0 flex-col gap-2 text-left">
                                <span className={`relative block aspect-[3/4] overflow-hidden rounded-[14px] bg-orange-100 transition-shadow ${on ? "ring-[2.5px] ring-stone-900 ring-offset-2 ring-offset-orange-50" : ""}`}>
                                  <Image src={p.images[0]} alt="" fill sizes="120px" className={`object-cover transition-transform duration-500 ${on ? "scale-105" : ""}`} />
                                  <AnimatePresence>
                                    {on && (
                                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-stone-900 text-white">
                                        <Check size={12} />
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </span>
                                <span className="text-[14px] leading-tight font-medium">{p.name}</span>
                              </motion.button>
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

                    <motion.div variants={item} className={`flex flex-col gap-3 rounded-[22px] border bg-white p-4 focus-within:border-stone-900 ${tried && !hasSource ? "border-red-400" : "border-stone-300"}`}>
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
                    {tried > 0 && !hasSource && <Problem>Add a photo, pick one of Mimi’s pieces, or describe your idea in a few words.</Problem>}
                  </Spot>
                )}

                {step === 1 && (
                  <>
                    {!unsized(d.piece) && (
                      <motion.div variants={item}>
                        <Spot id="f-size" flash={flash} className="flex flex-col gap-3">
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
                          {tried > 0 && !sizeDone && <Problem>Pick a size, or add your measurements.</Problem>}
                        </Spot>
                      </motion.div>
                    )}

                    <motion.div variants={item}>
                      <Spot id="f-colours" flash={flash} className="flex flex-col gap-2.5">
                        <span className="text-[15px] font-semibold" id="colours-label">Colours</span>
                        <div role="radiogroup" aria-labelledby="colours-label" className="flex flex-col gap-2.5">
                          <Choice
                            on={d.colours === "photo"}
                            onClick={() => set({ colours: "photo" })}
                            label={hasVisual ? "As in the photo" : "Mimi’s choice"}
                            hint={hasVisual ? (d.piece ? "Like the piece you picked" : "Like your photo") : "She suggests colours that suit the piece"}
                            invalid={tried > 0 && !d.colours}
                          />
                          <Choice on={d.colours === "different"} onClick={() => set({ colours: "different" })} label="Different colours" hint="Tell Mimi which colours you’d like" invalid={tried > 0 && !d.colours} />
                        </div>
                        <AnimatePresence initial={false}>
                          {d.colours === "different" && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-0.5 pb-0.5">
                              <input autoFocus value={d.colourNote} onChange={(e) => set({ colourNote: e.target.value.slice(0, 80) })} placeholder="e.g. lilac and white" className={`${inputClass} mt-1`} aria-label="Which colours" aria-invalid={tried > 0 && !coloursDone} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {tried > 0 && !coloursDone && <Problem>{d.colours === "different" ? "Name the colours you’d like." : "Choose the colours."}</Problem>}
                      </Spot>
                    </motion.div>

                    <motion.div variants={item}>
                      <Spot id="f-when" flash={flash} className="flex flex-col gap-3">
                        <span className="text-[15px] font-semibold">When do you need it?</span>
                        <div className="flex gap-2">
                          <Chip on={d.when === "none"} onClick={() => set({ when: "none" })}>No rush</Chip>
                          <Chip on={d.when === "date"} onClick={() => set({ when: "date" })}>By a date</Chip>
                        </div>
                        <AnimatePresence initial={false}>
                          {d.when === "date" && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease }} className="overflow-hidden px-0.5 pb-1">
                              <DatePicker id="when-date" value={d.date} onChange={(date) => set({ date })} now={today} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {tried > 0 && !whenDone && <Problem>{d.when === "date" ? "Pick a date on the calendar." : "Choose when you need it."}</Problem>}
                      </Spot>
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

                    <motion.div variants={item} className="flex flex-col gap-2">
                      <label htmlFor="notes" className="text-[15px] font-semibold">
                        Anything else? <span className="font-normal text-stone-500">(optional)</span>
                      </label>
                      <textarea id="notes" rows={3} value={d.notes} onChange={(e) => set({ notes: e.target.value.slice(0, 500) })} placeholder="Length, neckline, the occasion…" className={`${inputClass} h-auto py-3.5 leading-[1.5]`} />
                    </motion.div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <motion.div variants={item} className="flex flex-col gap-5">
                      <Spot id="f-name" flash={flash}>
                        <Field label="Your name" htmlFor="name" error={show("name") && !nameOk ? "Add your name, using letters only." : null} nudge={nameNudge} shake={tried}>
                          <NameInput id="name" value={d.name} onChange={(name) => set({ name })} onBlur={() => setTouched((t) => ({ ...t, name: true }))} invalid={show("name") && !nameOk} onNudge={nudgeName} />
                        </Field>
                      </Spot>
                      <Spot id="f-phone" flash={flash}>
                        <Field label="WhatsApp number" htmlFor="phone" hint="Mimi messages you here to agree the price." error={show("phone") ? phoneErr : null} nudge={phoneNudge} shake={tried}>
                          <PhoneInput id="phone" value={d.phone} onChange={(phone) => set({ phone })} onBlur={() => setTouched((t) => ({ ...t, phone: true }))} invalid={show("phone") && Boolean(phoneErr)} onNudge={nudgePhone} />
                        </Field>
                      </Spot>
                    </motion.div>

                    <motion.div variants={item}>
                      <Spot id="f-place" flash={flash} className="flex flex-col gap-4">
                        <div className="flex flex-col">
                          <span className="text-[15px] font-semibold">Delivery</span>
                          <span className="text-[14px] text-stone-500">Mimi delivers anywhere in Nigeria. You pay the rider on arrival.</span>
                        </div>
                        <Field label="State" htmlFor="state" error={tried > 0 && !d.state ? "Choose your state from the list." : null} shake={tried}>
                          <StatePicker id="state" value={d.state} onChange={(state) => set({ state, area: isLgaOf(state, d.area) ? d.area : "" })} invalid={tried > 0 && !d.state} />
                        </Field>
                        <Field label="Area" htmlFor="area" hint="Your local government area. Search by town too, like Lekki or Rumuola." error={tried > 0 && d.state && !placeOk ? "Choose your area from the list." : null} shake={tried}>
                          <AreaPicker id="area" state={d.state} value={d.area} onChange={(area) => set({ area })} invalid={tried > 0 && Boolean(d.state) && !placeOk} />
                        </Field>
                      </Spot>
                    </motion.div>

                    <motion.div variants={item} className="lg:hidden">
                      <Summary draft={d} rows={rows} step={step} onJump={jump} compact />
                    </motion.div>

                    {!unsized(d.piece) && (
                      <motion.div variants={item}>
                        <Spot id="f-sizeok" flash={flash}>
                          <label className={`flex cursor-pointer gap-3 rounded-[18px] border bg-white p-4 transition-colors ${tried > 0 && !d.sizeOk ? "border-red-400" : "border-transparent"}`}>
                            <input type="checkbox" checked={d.sizeOk} onChange={(e) => set({ sizeOk: e.target.checked })} className="mt-0.5 size-5 shrink-0 accent-stone-900" />
                            <span className="flex flex-col gap-1">
                              <span className="text-[15px] font-semibold">My size is right{d.size ? ` (${d.size})` : ""}</span>
                              <span className="text-[13px] leading-[1.45] text-stone-500">Mimi makes the piece to the size or measurements I gave. If they’re wrong, it can’t be remade for free.</span>
                            </span>
                          </label>
                          {tried > 0 && !d.sizeOk && <div className="pt-2"><Problem>Tick this to confirm your size.</Problem></div>}
                        </Spot>
                      </motion.div>
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
            <Summary draft={d} rows={rows} step={step} onJump={jump} />
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
            <Button className="flex-1 lg:w-[240px] lg:flex-none" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button className="flex-1 lg:w-[240px] lg:flex-none" onClick={send} disabled={Boolean(sending)}>
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
    </div>
  );

  return (
    <>
      {sent ? <SentView order={sent.order} files={sent.files} /> : flow}
      <AnimatePresence>
        {sending && (
          <SendingMoment
            key="sending"
            orderId={sending.order.id}
            image={sending.order.piece.image}
            title={sending.order.piece.name}
            rows={rows.map((r) => ({ key: r.key, value: r.value }))}
            onDone={() => {
              window.scrollTo({ top: 0 });
              setSent(sending);
              setSending(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
