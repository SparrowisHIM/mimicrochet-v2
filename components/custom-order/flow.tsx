"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { ChevronIcon, CloseIcon } from "@/components/icons";
import { IdeasSheet } from "@/components/custom-order/ideas-sheet";
import { formatMeasure, MeasureSheet, measureSteps, type MeasureKey, type Measures } from "@/components/custom-order/measure-sheet";
import { SendingMoment } from "@/components/custom-order/sending";
import { SentView } from "@/components/custom-order/sent";
import { VoiceNote, type Voice } from "@/components/custom-order/voice-note";
import { DatePicker, shortDate } from "@/components/form/date-picker";
import { Check, Field, inputClass, NameInput, PhoneInput, useNudge } from "@/components/form/fields";
import { AreaPicker, StatePicker } from "@/components/form/place-picker";
import { Button } from "@/components/ui/button";
import { CardStack } from "@/components/ui/card-stack";
import { Chip } from "@/components/ui/chip";
import { isLgaOf } from "@/lib/nigeria";
import { isRequestDate } from "@/lib/request-date";
import { newOrderIds, saveOrder, thumbnail, type Order } from "@/lib/orders";
import { pieceFromIdea, pieceFromProduct, type Piece } from "@/lib/pieces";
import { getProduct, type Product } from "@/lib/products";
import { sizeLabels } from "@/lib/sizes";
import { formatPhone, fullPhone, hasWords, isName, phoneDigits, phoneProblem } from "@/lib/validate";

// Layout follows the Figma frames "v2 · Design · Desktop · 1–3" and the shared "Request summary" component.
// Step change follows the motion brief (6 Oct): direction only, a 24px nudge with a fade, a no-bounce spring
// that can turn around mid-move, a quicker exit, and a plain fade for reduced motion. One entrance per step.

const easeOutExpo = [0.19, 1, 0.22, 1] as const;

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
  /** The town they searched by, like Lekki, kept beside the local government. */
  town?: string;
  sizeOk: boolean;
};

// First row is what shows; the second row opens with "View more pieces" (desktop) or by swiping (phones).
const starter = ["sunflower-crop-cardigan", "noir-bloom-crochet-shirt", "heart-sweater", "monochrome-crochet-shirt", "red-fringe-beach-set", "royal-wave-crochet-shirt", "lilac-ruffle-tube-dress", "candy-bloom-ruffle-set"]
  .map((s) => getProduct(s))
  .filter(Boolean) as Product[];

const unsized = (p?: Piece) => p && !p.sized;

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
    <div className="flex gap-1.5 lg:gap-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="relative h-1 flex-1 overflow-hidden rounded-full bg-stone-200">
          <motion.span
            className="absolute inset-0 origin-left rounded-full bg-stone-900"
            initial={false}
            animate={{ scaleX: i <= step ? 1 : 0 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0 }}
          />
        </span>
      ))}
    </div>
  );
}

/** A section the summary can jump to; it glows for a moment when you land on it. */
function Spot({ id, flash, className = "", children }: { id: string; flash: { id: string; n: number } | null; className?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="relative scroll-mt-28">
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
      {/* The layout classes go on the inner box, so gaps between the children actually apply. */}
      <div className={`relative ${className}`}>{children}</div>
    </div>
  );
}

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 text-[13px] font-medium text-red-700">
      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-red-600 text-[10px] font-bold text-white" aria-hidden>
        !
      </span>
      {children}
    </motion.p>
  );
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-[15px] font-semibold">{children}</span>
      {hint && <span className="text-[14px] text-stone-500">{hint}</span>}
    </span>
  );
}

/** The step and the way out, under the site header. Without a step it's the confirmation. */
function StepBar({ step }: { step?: number }) {
  return (
    <div className="container-page flex flex-col gap-3 pt-5 lg:pt-8">
      <div className="flex items-center justify-between text-[14px]">
        <span className="font-medium text-stone-500 tabular-nums">{step === undefined ? "Custom order" : `Custom order · Step ${step + 1} of 3`}</span>
        <Link href="/" className="font-medium underline underline-offset-4">
          Exit
        </Link>
      </div>
      <Progress step={step ?? 3} />
    </div>
  );
}

/* ----------------------------- the request summary (Figma "Request summary") ----------------------------- */

type RowState = "done" | "todo" | "warn";
type Row = { key: string; value: string; state: RowState; step: number; field: string };
const groups = ["The idea", "Make it yours", "You"];

function RowIcon({ state }: { state: RowState }) {
  const reduce = useReducedMotion();
  if (state === "todo") return <span className="block size-4 shrink-0 rounded-full border-[1.5px] border-dashed border-stone-300" aria-hidden />;
  return (
    <motion.span
      key={state}
      className={`grid size-4 shrink-0 place-items-center rounded-full text-white ${state === "done" ? "bg-emerald-600" : "bg-amber-500"}`}
      initial={reduce ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", duration: 0.3, bounce: 0.3 }}
      aria-hidden
    >
      {state === "done" ? <Check size={9} /> : <span className="text-[10px] leading-none font-bold">!</span>}
    </motion.span>
  );
}

function PieceSlot({ draft, onChange }: { draft: Draft; onChange: () => void }) {
  const p = draft.piece;
  const photo = draft.photos[0];
  const chosen = Boolean(p || photo || hasWords(draft.words, 4) || draft.voice);
  const name = p ? p.name : photo ? "Your photo" : chosen ? "Your idea" : "Your piece";
  const meta = p
    ? p.price
      ? `From ₦${p.price.toLocaleString("en-NG")}, made to order`
      : "Price on request"
    : chosen
      ? "Mimi prices it with you on WhatsApp."
      : "Add a photo or pick a piece, and it shows up here.";
  return (
    <div className="flex items-center gap-4">
      <span className="relative h-32 w-24 shrink-0 overflow-hidden rounded-[12px] xl:h-40 xl:w-[120px] [@media(max-height:860px)]:h-20 [@media(max-height:860px)]:w-[60px]">
        {p ? (
          <Image src={p.image} alt="" fill sizes="120px" className="object-cover" />
        ) : photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.preview} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center rounded-[12px] border-[1.5px] border-dashed border-stone-300 bg-stone-50 text-stone-400" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="8.5" cy="9.5" r="1.6" fill="currentColor" />
              <path d="m4 17 4.8-4.6a1.5 1.5 0 0 1 2 0L15 16.5l2-1.9a1.5 1.5 0 0 1 2 0l1.5 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className={`font-serif text-[22px] leading-tight ${chosen ? "text-stone-900" : "text-stone-400"}`}>{name}</span>
        <span className="text-[14px] leading-snug text-stone-500">{meta}</span>
        {chosen && (
          <button type="button" onClick={onChange} className="self-start text-[14px] font-medium underline underline-offset-4">
            Change
          </button>
        )}
      </span>
    </div>
  );
}

function Summary({ draft, rows, step, onJump, compact }: { draft: Draft; rows: Row[]; step: number; onJump: (r: Row) => void; compact?: boolean }) {
  const reduce = useReducedMotion();
  const ready = rows.filter((r) => r.state === "done").length;
  const all = ready === rows.length && (unsized(draft.piece) || draft.sizeOk);

  return (
    <div className="relative flex flex-col gap-[18px] rounded-[22px] bg-white p-5 shadow-[0_24px_56px_-32px_rgb(28_25_23/0.3)] lg:p-6">
      <div className="flex items-center justify-between">
        <span className="text-[16px] font-semibold">Your request</span>
        <motion.span className="text-[14px] font-medium text-stone-500 tabular-nums" animate={{ opacity: all ? 0 : 1 }} transition={{ duration: 0.15 }}>
          {ready} of {rows.length}
        </motion.span>
      </div>

      {!compact && <PieceSlot draft={draft} onChange={() => onJump(rows[0])} />}

      <div className="flex flex-col gap-3.5">
        {groups.map((g, gi) => {
          const here = gi === step;
          return (
            <div key={g} className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 px-3 text-[12px] font-medium text-stone-400">
                {g}
                <span className="h-px flex-1 border-t border-dashed border-stone-200" aria-hidden />
              </span>
              <div className={`flex flex-col rounded-[14px] px-3 transition-colors duration-200 ${here ? "bg-stone-50 ring-1 ring-stone-100" : ""}`}>
                {rows
                  .filter((r) => r.step === gi)
                  .map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => onJump(r)}
                      className="group relative flex items-center gap-2.5 border-b border-stone-100 py-[11px] text-left text-[15px] last:border-b-0"
                      aria-label={`${r.key}: ${r.value || "not added yet"}. Change`}
                    >
                      {/* A fresh key per value makes the row flash amber when it's filled or changed. */}
                      {r.value && !reduce && (
                        <motion.span
                          key={r.value}
                          className="absolute -inset-x-2 inset-y-0.5 rounded-[10px] bg-amber-100"
                          initial={{ opacity: 0.9 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 0.6, ease: easeOutExpo }}
                          aria-hidden
                        />
                      )}
                      <span className="relative">
                        <RowIcon state={r.state} />
                      </span>
                      <span className="relative text-stone-500 transition-colors duration-150 group-hover:text-stone-900">{r.key}</span>
                      <span
                        className={`relative ml-auto max-w-[60%] truncate text-right ${
                          r.state === "done" ? "font-medium text-stone-900" : r.state === "warn" ? "font-medium text-amber-800" : "text-stone-300"
                        }`}
                      >
                        {r.value || "—"}
                      </span>
                      <ChevronIcon size={14} className="relative -mr-1 shrink-0 text-stone-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100" />
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {ready > 0 && (
        <p className="text-[13px] text-stone-400">
          <span className="lg:hidden">Tap</span>
          <span className="max-lg:hidden">Click</span> any line to change it.
        </p>
      )}

      {!compact && (
        <p className="rounded-[12px] bg-orange-50 px-4 py-3.5 text-[14px] leading-snug text-stone-600 [@media(max-height:860px)]:hidden">No payment now. Mimi confirms the price on WhatsApp before she starts.</p>
      )}

      <AnimatePresence>
        {all && (
          <motion.div
            className="absolute -top-4 -right-3 grid size-[92px] place-items-center rounded-full border-2 border-emerald-700 bg-emerald-50 text-center text-[13px] leading-[1.15] font-semibold text-emerald-800 shadow-[0_10px_24px_-10px_rgb(4_120_87/0.5)]"
            initial={reduce ? { opacity: 0 } : { scale: 1.6, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: -12, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            transition={reduce ? { duration: 0.2 } : { type: "spring", duration: 0.45, bounce: 0.35 }}
            role="status"
          >
            <span className="flex flex-col items-center gap-1">
              <Check size={15} />
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
  const [voiceLive, setVoiceLive] = useState(false);
  const [morePieces, setMorePieces] = useState(false);
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
      key: "Contact",
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
      value: placeOk ? `${d.town ? `${d.town}, ` : ""}${d.area}, ${d.state}` : d.state ? "Choose your area" : "",
      state: placeOk ? "done" : d.state ? "warn" : "todo",
    },
  ];

  /** afterErrors: error messages just opened. Their growth makes the browser re-anchor the page,
   *  which cancels a smooth scroll started straight away, so wait for them first. */
  const focusField = (id: string, afterErrors = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Step 1's options are taller than a phone screen, so land on their top, where the message is.
    const scroll = () => el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: id === "f-source" ? "start" : "center" });
    if (afterErrors) setTimeout(scroll, 240);
    else scroll();
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
    if (then) setTimeout(() => focusField(then), reduce ? 60 : 320);
    else requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  };

  /** From the summary: go straight to a line. */
  const jump = (r: Row) => {
    if (r.step === step) focusField(r.field);
    else go(r.step, r.field);
  };

  const next = () => {
    const done = step === 0 ? hasSource : step2Done;
    if (!done) {
      setTried((t) => t + 1);
      focusField(firstMissing(step), true);
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
      return focusField(firstMissing(2), true);
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
      area: d.town ? `${d.town}, ${d.area}` : d.area,
      stage: 0,
      sent: false,
      updates: [{ stage: 0, note: "Request prepared. Send the details to Mimi on WhatsApp to confirm.", at: "Today" }],
    };
    saveOrder(order);
    setSending({ order, files: [...d.photos.map((p) => p.file), ...(d.voice ? [d.voice.file] : [])] });
  };

  // The step change, per the brief.
  const stepMotion = {
    enter: (dr: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: 24 * dr, filter: "blur(2px)" }),
    center: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: reduce ? { duration: 0.15 } : { type: "spring" as const, duration: 0.28, bounce: 0 },
      // A leftover filter makes the step its own layer, which traps the state and area lists
      // under the phone's sticky Send bar. Clear it once the step has landed.
      transitionEnd: { filter: "none" },
    },
    exit: (dr: number) =>
      reduce
        ? { opacity: 0, transition: { duration: 0.15 } }
        : { opacity: 0, x: -24 * dr, filter: "blur(2px)", transition: { duration: 0.15, ease: easeOutExpo } },
  };

  const title = ["What should Mimi make?", "Make it yours", "Where can Mimi reach you?"][step];
  const lead = [
    "Show her a photo or one of her pieces, then tell her about it. No payment now.",
    "Mimi uses this to price your piece and plan the timeline.",
    "She’ll message you on WhatsApp to agree the price. Nothing is charged today.",
  ][step];

  const backButton = step > 0 && (
    <button type="button" onClick={() => go(step - 1)} className="px-1 text-[16px] font-semibold underline underline-offset-4">
      Back
    </button>
  );
  const mainButton = (cls: string) =>
    step < 2 ? (
      <Button className={cls} onClick={next}>
        Continue
      </Button>
    ) : (
      <Button className={cls} onClick={send} disabled={Boolean(sending)}>
        Send to Mimi
      </Button>
    );

  const pieceTile = (p: Product, extra = "") => {
    const on = d.piece?.slug === p.slug;
    const other = Boolean(d.piece) && !on;
    return (
      <motion.button
        key={p.slug}
        type="button"
        whileTap={{ scale: 0.97 }}
        aria-pressed={on}
        onClick={() => set({ piece: on ? undefined : pieceFromProduct(p) })}
        className={`group flex w-[120px] shrink-0 flex-col gap-2 text-left transition-opacity duration-200 lg:w-auto ${other ? "opacity-55 hover:opacity-100" : ""} ${extra}`}
      >
        <span
          className={`relative block aspect-[3/4] overflow-hidden rounded-[14px] bg-orange-100 transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:shadow-[0_14px_28px_-16px_rgb(28_25_23/0.45)] motion-reduce:group-hover:translate-y-0 ${
            on ? "ring-[2.5px] ring-stone-900 ring-offset-2 ring-offset-orange-50" : ""
          }`}
        >
          <Image src={p.images[0]} alt="" fill sizes="(min-width: 1024px) 150px, 120px" className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05] motion-reduce:group-hover:scale-100" />
          <AnimatePresence>
            {on && (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.12 } }}
                transition={{ type: "spring", duration: 0.3, bounce: 0.3 }}
                className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-stone-900 text-white"
              >
                <Check size={12} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className={`text-[14px] leading-tight font-medium transition-colors duration-200 lg:min-h-[2lh] ${on ? "text-stone-900" : "text-stone-700 group-hover:text-stone-900"}`}>{p.name}</span>
      </motion.button>
    );
  };

  const ideasCard = (
    <button type="button" onClick={() => setIdeasOpen(true)} className="group flex items-center gap-2 rounded-[16px] bg-amber-100 py-2 pr-4 pl-1 text-left transition-colors duration-150 hover:bg-amber-200/70">
      <CardStack images={["/images/ideas/daisy-ruffle-crochet-set.jpg", "/images/ideas/azure-bloom-granny-bucket-hat.jpg", "/images/ideas/carnival-granny-crochet-shirt.jpg"]} />
      <span className="flex flex-1 flex-col">
        <span className="text-[15px] font-semibold text-amber-900">{d.piece?.source === "idea" ? `Idea: ${d.piece.name}` : "Need ideas?"}</span>
        <span className="text-[13px] text-amber-800">Concepts, or search Pinterest</span>
      </span>
      <ChevronIcon size={18} className="text-amber-800 transition-transform duration-150 group-hover:translate-x-0.5" />
    </button>
  );

  const flow = (
    // The offset clears the sticky site header, so "Step 2 of 3" stays visible after a step change.
    <div ref={top} className="scroll-mt-[62px] lg:scroll-mt-[72px]">
      <StepBar step={step} />

      <div className="container-page flex justify-between gap-12 pt-7 pb-10 lg:pt-12 lg:pb-28 xl:gap-16">
        {/* lg:pb: room under the form, so the request summary beside it stays pinned in view
            while you reach the Send button, instead of scrolling away before the footer. */}
        <div className="relative min-w-0 flex-1 lg:max-w-[640px] lg:pb-[45vh]">
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.div key={step} custom={dir} variants={stepMotion} initial="enter" animate="center" exit="exit" className="flex flex-col gap-8">
              {step === 1 && d.piece && (
                <div className="flex items-center gap-3 rounded-[18px] bg-white p-3 pr-4 lg:hidden">
                  <span className="relative h-20 w-[60px] shrink-0 overflow-hidden rounded-[10px] bg-orange-100">
                    <Image src={d.piece.image} alt="" fill sizes="60px" className="object-cover" />
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-[15px] font-medium">{d.piece.name}</span>
                    <span className="text-[14px] text-stone-500">{d.piece.price ? `From ₦${d.piece.price.toLocaleString("en-NG")}, made to order` : "Price on request"}</span>
                  </span>
                  <button type="button" onClick={() => go(0)} className="text-[14px] font-medium underline underline-offset-4">
                    Change
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <h1 className="font-serif text-[32px] leading-[1.08] tracking-[-0.01em] lg:text-[44px]">{title}</h1>
                <p className="text-[16px] leading-[1.5] text-stone-600">{lead}</p>
              </div>

              {step === 0 && (
                <Spot id="f-source" flash={flash} className="flex flex-col gap-9">
                  {tried > 0 && !hasSource && <Problem>Add a photo, pick one of Mimi’s pieces, or describe your idea in a few words.</Problem>}
                  <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />

                  <div className="flex flex-col gap-3.5">
                    <Label>Show Mimi a photo</Label>
                    {d.photos.length === 0 ? (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.985 }}
                        onClick={() => fileInput.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                        className={`group flex flex-col items-center gap-2 rounded-[18px] border-[1.5px] border-dashed bg-white px-6 py-8 text-center transition-colors duration-150 hover:border-stone-900 lg:py-9 ${tried && !hasSource ? "border-red-400" : "border-stone-400"}`}
                      >
                        <span className="grid size-12 place-items-center rounded-full bg-orange-100 text-[24px] leading-none text-amber-800 transition-colors duration-150 group-hover:bg-amber-200">+</span>
                        <span className="text-[17px] font-semibold">Add a photo</span>
                        <span className="max-w-[320px] text-[14px] text-stone-600">A screenshot, a Pinterest pin, or a photo of something you love.</span>
                        <span className="text-[13px] text-stone-400 max-lg:hidden">or drop it here</span>
                      </motion.button>
                    ) : (
                      // The photos themselves, as tiles: the first one leads the request ("Main"), up to six.
                      <ul className="grid grid-cols-3 gap-2.5 lg:grid-cols-4" aria-label="Your photos">
                        <AnimatePresence initial={false} mode="popLayout">
                          {d.photos.map((p, i) => (
                            <motion.li
                              key={p.id}
                              layout
                              initial={{ opacity: 0, scale: 0.92 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
                              transition={{ duration: 0.35, ease: easeOutExpo }}
                              className="relative aspect-[4/5] overflow-hidden rounded-[14px] bg-orange-100"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.preview} alt={`Your photo ${i + 1}`} className="size-full object-cover" />
                              {i === 0 && <span className="absolute bottom-2 left-2 rounded-full bg-white/92 px-2 py-0.5 text-[12px] font-semibold text-stone-900">Main</span>}
                              <button
                                type="button"
                                onClick={() => set({ photos: d.photos.filter((x) => x.id !== p.id) })}
                                aria-label={`Remove photo ${i + 1}`}
                                className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-white/92 text-stone-900 shadow-[0_2px_8px_rgb(28_25_23/0.18)] transition-transform duration-150 active:scale-90"
                              >
                                <CloseIcon size={15} />
                              </button>
                            </motion.li>
                          ))}
                          {d.photos.length < 6 && (
                            <motion.li key="add" layout transition={{ duration: 0.35, ease: easeOutExpo }}>
                              <button
                                type="button"
                                onClick={() => fileInput.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                                className="group flex aspect-[4/5] w-full flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-stone-300 bg-white/60 text-[14px] font-medium transition-colors duration-150 hover:border-stone-900"
                              >
                                <span className="grid size-9 place-items-center rounded-full bg-orange-100 text-[20px] leading-none text-amber-800 transition-colors duration-150 group-hover:bg-amber-200" aria-hidden>+</span>
                                Add photo
                              </button>
                            </motion.li>
                          )}
                        </AnimatePresence>
                      </ul>
                    )}
                  </div>

                  {d.photos.length === 0 && (
                    <>
                      <div className="flex items-center gap-3.5 text-[14px] font-medium text-stone-500" aria-hidden>
                        <span className="h-px flex-1 bg-stone-200" />
                        or
                        <span className="h-px flex-1 bg-stone-200" />
                      </div>

                      <div className="flex flex-col gap-3.5">
                        <Label>Pick one of Mimi’s pieces</Label>
                        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-4 lg:overflow-visible lg:px-0">
                          {starter.map((p, i) => pieceTile(p, i >= 4 ? "lg:hidden" : ""))}
                        </div>
                        <AnimatePresence initial={false}>
                          {morePieces && (
                            <motion.div
                              id="more-pieces"
                              className="-mx-1.5 overflow-hidden px-1.5 max-lg:hidden"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1, transition: { duration: 0.27, ease: [0.25, 1, 0.5, 1] } }}
                              exit={{ height: 0, opacity: 0, transition: { duration: 0.2, ease: easeOutExpo } }}
                            >
                              <div className="grid grid-cols-4 gap-x-4 pt-3 pb-1.5">{starter.slice(4).map((p) => pieceTile(p))}</div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {/* "More pieces" on a hairline, the same device as the "or" divider (Figma, option A) */}
                        <div className="flex items-center gap-3.5 max-lg:hidden">
                          <span className="h-px flex-1 bg-stone-200" aria-hidden />
                          <button
                            type="button"
                            onClick={() => setMorePieces((v) => !v)}
                            aria-expanded={morePieces}
                            aria-controls="more-pieces"
                            className="group flex items-center gap-2 rounded-full py-1 pr-1 pl-2 text-[14px] font-medium text-stone-900"
                          >
                            <span className="underline-offset-4 group-hover:underline">{morePieces ? "Fewer pieces" : "More pieces"}</span>
                            <motion.span
                              animate={{ rotate: morePieces ? 180 : 0 }}
                              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                              className="grid size-[26px] place-items-center rounded-full border border-stone-200 bg-white text-stone-600 transition-colors duration-150 group-hover:border-stone-400 group-hover:text-stone-900"
                            >
                              <ChevronIcon size={13} className="rotate-90" />
                            </motion.span>
                          </button>
                          <span className="h-px flex-1 bg-stone-200" aria-hidden />
                        </div>
                        {ideasCard}
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-2.5">
                    <Label hint={hasVisual ? "Optional. Type it, or tap the voice button and talk." : "Type it, or tap the voice button and talk."}>Tell Mimi about it</Label>
                    <div
                      data-live={voiceLive || undefined}
                      data-invalid={(tried > 0 && !hasSource && !voiceLive) || undefined}
                      className="chat-ring flex flex-col gap-3 rounded-[22px] p-4"
                    >
                      <label className="sr-only" htmlFor="describe">Tell Mimi about it</label>
                      <textarea
                        id="describe"
                        rows={3}
                        value={d.words}
                        onChange={(e) => set({ words: e.target.value })}
                        placeholder="The piece, the colours, the occasion…"
                        className="w-full resize-none bg-transparent text-[16px] leading-[1.5] outline-none placeholder:text-stone-400"
                      />
                      <VoiceNote
                        value={d.voice}
                        onChange={(voice) => set({ voice })}
                        onLiveChange={setVoiceLive}
                        leading={
                          <button type="button" onClick={() => fileInput.current?.click()} className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-orange-50 text-[22px] leading-none transition-colors duration-150 hover:bg-orange-100" aria-label="Add a photo">
                            +
                          </button>
                        }
                      />
                    </div>
                  </div>
                </Spot>
              )}

              {step === 1 && (
                <>
                  {!unsized(d.piece) && (
                    <Spot id="f-size" flash={flash} className="flex flex-col gap-3">
                      <Label>Size</Label>
                      <div className="flex gap-2" role="radiogroup" aria-label="Size">
                        {sizeLabels.map((s) => (
                          <Chip key={s} on={d.size === s} onClick={() => set({ size: d.size === s ? undefined : s, sizeOk: false })} className="flex-1 justify-center max-[380px]:px-3 lg:flex-none lg:px-6">
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
                                <span className={`flex h-12 items-center justify-between rounded-[12px] border px-3.5 text-[16px] transition-colors duration-150 hover:border-stone-500 ${v ? "border-stone-900 font-medium" : "border-stone-300 text-stone-400"}`}>
                                  {v ? formatMeasure(v, d.unit) : "Add"}
                                  <span className="text-[13px] text-stone-400">{d.unit}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[13px] text-stone-500">Tip: measure your body over light clothing, with the tape snug but not tight.</p>
                      </div>
                      {tried > 0 && !sizeDone && <Problem>Pick a size, or add your measurements.</Problem>}
                    </Spot>
                  )}

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
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: easeOutExpo }} className="overflow-hidden px-0.5 pb-0.5">
                          <input autoFocus value={d.colourNote} onChange={(e) => set({ colourNote: e.target.value.slice(0, 80) })} placeholder="e.g. lilac and white" className={`${inputClass} mt-1`} aria-label="Which colours" aria-invalid={tried > 0 && !coloursDone} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {tried > 0 && !coloursDone && <Problem>{d.colours === "different" ? "Name the colours you’d like." : "Choose the colours."}</Problem>}
                  </Spot>

                  <Spot id="f-when" flash={flash} className="flex flex-col gap-3">
                    <Label>When do you need it?</Label>
                    <div className="flex gap-2">
                      <Chip on={d.when === "none"} onClick={() => set({ when: "none" })}>No rush</Chip>
                      <Chip on={d.when === "date"} onClick={() => set({ when: "date" })}>By a date</Chip>
                    </div>
                    <AnimatePresence initial={false}>
                      {d.when === "date" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: easeOutExpo }} className="overflow-hidden px-0.5 pb-1">
                          <DatePicker id="when-date" value={d.date} onChange={(date) => set({ date })} now={today} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {tried > 0 && !whenDone && <Problem>{d.when === "date" ? "Pick a date on the calendar." : "Choose when you need it."}</Problem>}
                  </Spot>

                  {needsBudget && (
                    <div className="flex flex-col gap-3">
                      <span className="text-[15px] font-semibold">
                        Your budget <span className="font-normal text-stone-500">(optional)</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {["Under ₦30k", "₦30k–60k", "₦60k–100k", "Over ₦100k"].map((b) => (
                          <Chip key={b} on={d.budget === b} onClick={() => set({ budget: d.budget === b ? undefined : b })}>
                            {b}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label htmlFor="notes" className="text-[15px] font-semibold">
                      Anything else? <span className="font-normal text-stone-500">(optional)</span>
                    </label>
                    <textarea id="notes" rows={3} value={d.notes} onChange={(e) => set({ notes: e.target.value.slice(0, 500) })} placeholder="Length, neckline, the occasion…" className={`${inputClass} h-auto py-3.5 leading-[1.5]`} />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex flex-col gap-6">
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
                  </div>

                  <Spot id="f-place" flash={flash} className="flex flex-col gap-4">
                    <Label hint="Mimi delivers anywhere in Nigeria. You pay the rider on arrival.">Delivery</Label>
                    <Field label="State" htmlFor="state" error={tried > 0 && !d.state ? "Choose your state from the list." : null} shake={tried}>
                      <StatePicker
                        id="state"
                        value={d.state}
                        onChange={(state, place) => set(place.lga ? { state, area: place.lga, town: place.town } : isLgaOf(state, d.area) ? { state } : { state, area: "", town: undefined })}
                        invalid={tried > 0 && !d.state}
                      />
                    </Field>
                    <Field label="Area" htmlFor="area" hint="Your local government area. Search by town too, like Lekki or Rumuola." error={tried > 0 && d.state && !placeOk ? "Choose your area from the list." : null} shake={tried}>
                      <AreaPicker id="area" state={d.state} value={d.area} town={d.town} onChange={(area, town) => set({ area, town })} invalid={tried > 0 && Boolean(d.state) && !placeOk} />
                    </Field>
                  </Spot>

                  <div className="lg:hidden">
                    <Summary draft={d} rows={rows} step={step} onJump={jump} compact />
                  </div>

                  {!unsized(d.piece) && (
                    <Spot id="f-sizeok" flash={flash}>
                      <label className={`flex cursor-pointer gap-3 rounded-[18px] border-[1.5px] bg-white p-4 transition-colors duration-150 ${tried > 0 && !d.sizeOk ? "border-red-400" : d.sizeOk ? "border-stone-900" : "border-transparent"}`}>
                        <input type="checkbox" checked={d.sizeOk} onChange={(e) => set({ sizeOk: e.target.checked })} className="mt-0.5 size-5 shrink-0 accent-stone-900" />
                        <span className="flex flex-col gap-1">
                          <span className="text-[15px] font-semibold">My size is right{d.size ? ` (${d.size})` : ""}</span>
                          <span className="text-[13px] leading-[1.45] text-stone-500">Mimi makes the piece to the size or measurements I gave. If they’re wrong, it can’t be remade for free.</span>
                        </span>
                      </label>
                      {tried > 0 && !d.sizeOk && (
                        <div className="pt-2">
                          <Problem>Tick this to confirm your size.</Problem>
                        </div>
                      )}
                    </Spot>
                  )}
                  <p className="text-[14px] text-stone-500 lg:hidden">No payment now. Mimi confirms the price with you on WhatsApp before she starts.</p>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Desktop: the actions sit right under the form and stay put while the steps change */}
          <div className="mt-10 hidden items-center gap-6 lg:flex">
            {backButton}
            {mainButton("px-8")}
          </div>
        </div>

        <aside className="hidden shrink-0 lg:block lg:w-[360px] xl:w-[460px] min-[87.5rem]:w-[560px]" aria-label="Your request">
          {/* On laptop-height screens the summary compacts (smaller photo, no payment note) so the
              whole card, Ready to send stamp included, stays in view while you finish the form. */}
          <div className="sticky top-24">
            <Summary draft={d} rows={rows} step={step} onJump={jump} />
          </div>
        </aside>
      </div>

      {/* Phones: the actions stay in reach at the bottom */}
      <div className="sticky bottom-0 z-30 border-t border-stone-200/70 bg-orange-50/95 backdrop-blur-md lg:hidden">
        <div className="container-page flex items-center gap-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          {backButton}
          {mainButton("flex-1")}
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
      {sent ? (
        <>
          <SentView order={sent.order} files={sent.files} />
        </>
      ) : (
        flow
      )}
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
