"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronIcon, WhatsAppIcon } from "@/components/icons";
import { Button, linkClass } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { Toggle } from "@/components/ui/toggle";
import { depositOf, patchOrder, useOrders, type Order } from "@/lib/orders";
import { checkPhoto } from "@/lib/upload-safety";
import { formatNaira } from "@/lib/site";
import { stages } from "@/lib/stages";
import { sampleOrders } from "@/lib/studio";

type Row = Order & { due: string; dueTone: "normal" | "soon" | "late"; ago: string };

const stageTone = ["bg-amber-100 text-amber-800", "bg-stone-100 text-stone-700", "bg-amber-100 text-amber-800", "bg-emerald-100 text-emerald-800", "bg-emerald-100 text-emerald-800"];
const stageName = ["New", "Price agreed", "In progress", "Ready", "Delivered"];
const dueClass = { normal: "text-stone-500", soon: "font-semibold text-amber-700", late: "font-semibold text-red-700" };
const waTo = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

function nextStep(o: Row) {
  if (o.stage === 0) return o.price ? "Agree the price" : o.piece.source === "photo" ? "Reply on WhatsApp" : "Agree the price";
  if (o.stage === 1) return o.depositPaid ? "Start making" : "Check the deposit";
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

/* ------------------------------- action sheets ------------------------------- */

function SetPrice({ o, onDone }: { o: Row; onDone: () => void }) {
  const [price, setPrice] = useState(o.piece.price ? String(o.piece.price + 5000) : "");
  const [date, setDate] = useState("");
  const [rush, setRush] = useState(0);
  const [riderPays, setRiderPays] = useState(true);
  const total = (Number(price.replace(/\D/g, "")) || 0) + rush;
  const deposit = depositOf(total);
  const ready = date ? new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "";
  const what = o.piece.source === "photo" || o.piece.source === "words" ? "custom piece" : o.piece.name;
  const msg = `Hi ${o.name}! Your ${what}${o.size ? ` in ${o.size}` : ""} is ${total ? formatNaira(total) : "₦…"}${ready ? `, ready by ${ready}` : ""}. To start, please pay the 60% deposit (${total ? formatNaira(deposit) : "₦…"}), or the full ${total ? formatNaira(total) : "price"} if you prefer. ${riderPays ? "Delivery is paid to the rider on arrival." : "Delivery is included."} Your order page: ${typeof window !== "undefined" ? window.location.origin : ""}/t/${o.code}`;
  const ok = total > 0 && Boolean(date);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-[14px] font-semibold">Price</span>
          <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="₦" className="h-12 rounded-[12px] border border-stone-300 bg-white px-3.5 text-[16px] outline-none focus:border-stone-900" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[14px] font-semibold">Ready by</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-[12px] border border-stone-300 bg-white px-3 text-[16px] outline-none focus:border-stone-900" />
        </label>
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
      <div className="flex flex-col gap-2 rounded-[14px] bg-white p-4">
        <span className="flex items-center gap-2 text-[14px] font-semibold"><WhatsAppIcon size={16} /> Message to {o.name} <span className="font-normal text-stone-400">draft</span></span>
        <p className="border-l-2 border-stone-200 pl-3 text-[14px] leading-[1.5] text-stone-600">{msg}</p>
      </div>
      <Button arrow={false}
        disabled={!ok}
        onClick={() => {
          patchOrder(o, { stage: 1, price: total, readyBy: ready, depositPaid: false, updates: [...o.updates, { stage: 1, note: `${formatNaira(total)}, ready by ${ready}. Deposit ${formatNaira(deposit)}, or pay it all now.`, at: "Today" }] });
          window.open(waTo(o.phone, msg), "_blank", "noopener");
          onDone();
        }}
      >
        <WhatsAppIcon size={18} /> Save and send on WhatsApp
      </Button>
      <p className="-mt-2 text-center text-[13px] text-stone-500">{o.name}’s order page updates as soon as you save.</p>
    </div>
  );
}

function PostUpdate({ o, onDone }: { o: Row; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[15px] text-stone-600">{o.name} sees this on their tracking page.</p>
      <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; const c = await checkPhoto(f, { preview: 900 }); if (c.ok && c.preview) { setPhoto(c.preview); setPhotoNote(null); } else setPhotoNote(c.ok ? "That photo can’t be shown here. Try a JPEG or PNG." : c.reason); }} />
      <div className="grid grid-cols-3 gap-2.5">
        {photo ? (
          <span className="relative aspect-[3/4] overflow-hidden rounded-[12px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Your progress photo" className="size-full object-cover" />
          </span>
        ) : null}
        <button type="button" onClick={() => file.current?.click()} className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-[12px] border-[1.5px] border-dashed border-stone-300 text-[13px] text-stone-600 hover:border-stone-900">
          <span className="text-[22px] leading-none">+</span>
          {photo ? "Change" : "Camera or gallery"}
        </button>
      </div>
      {photoNote && <p className="-mt-2 text-[13px] text-amber-800" role="status">{photoNote}</p>}
      <label className="flex flex-col gap-2">
        <span className="text-[14px] font-semibold">Note (optional)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. The top is done. Starting the skirt now." className="h-12 rounded-[12px] border border-stone-300 bg-white px-3.5 text-[16px] outline-none focus:border-stone-900" />
      </label>
      <div className="flex flex-wrap gap-2">
        {["Halfway there", "Almost ready", "Ready to send"].map((q) => (
          <Chip key={q} on={note === q} onClick={() => setNote(q)}>{q}</Chip>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-[14px] bg-white p-4">
        <span className="flex flex-col">
          <span className="text-[15px] font-semibold">Also mark as ready</span>
          <span className="text-[13px] text-stone-500">Moves their page to “Ready”</span>
        </span>
        <Toggle label="Also mark as ready" hideLabel checked={ready} onChange={setReady} />
      </div>
      <Button
        disabled={!note && !photo}
        onClick={() => {
          const stage = ready ? 3 : Math.max(o.stage, 2);
          patchOrder(o, { stage, updates: [...o.updates, { stage, note: note || (ready ? "All done! Photos on WhatsApp." : "New photo from Mimi."), at: "Just now", photo: photo ?? undefined }] });
          onDone();
        }}
      >
        Post update
      </Button>
    </div>
  );
}

/* ------------------------------- order panel ------------------------------- */

function OrderPanel({ o, onClose }: { o: Row; onClose: () => void }) {
  const [mode, setMode] = useState<"detail" | "price" | "update">("detail");
  const deposit = o.price ? depositOf(o.price) : 0;
  const title = mode === "price" ? `Set ${o.name}’s price` : mode === "update" ? "Post an update" : `${o.name} · ${o.id}`;

  return (
    <Sheet open onClose={onClose} title={title}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          {mode === "price" ? (
            <SetPrice o={o} onDone={() => setMode("detail")} />
          ) : mode === "update" ? (
            <PostUpdate o={o} onDone={() => setMode("detail")} />
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                {o.piece.image && (
                  <span className="relative h-[75px] w-14 shrink-0 overflow-hidden rounded-[10px] bg-orange-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.piece.image} alt="" className="size-full object-cover" />
                  </span>
                )}
                <span className="flex flex-col">
                  <span className="text-[16px] font-semibold">{pieceName(o)}</span>
                  <span className="text-[14px] text-stone-500">{[o.size && `Size ${o.size}`, o.colours === "photo" ? "Colours as in the photo" : o.colourNote, o.when].filter(Boolean).join(" · ")}</span>
                  <span className={`mt-1 self-start rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${stageTone[o.stage]}`}>{stageName[o.stage]}</span>
                </span>
              </div>

              {o.stage === 0 && <Button onClick={() => setMode("price")}>Set price</Button>}
              {o.stage === 1 && !o.depositPaid && (
                <div className="flex flex-col gap-3 rounded-[16px] bg-amber-50 p-4">
                  <p className="text-[15px]"><b>{o.name} says they’ve paid.</b> Check your bank app for {formatNaira(deposit)} (the 60% deposit) or {formatNaira(o.price ?? 0)} (the full price). Once it’s there, confirm and their page moves to “In progress”.</p>
                  <Button onClick={() => patchOrder(o, { depositPaid: true, paidInFull: false, stage: 2, updates: [...o.updates, { stage: 2, note: "Deposit received. Mimi is starting.", at: "Today" }] })}>Deposit received</Button>
                  <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                    <button type="button" className={linkClass} onClick={() => patchOrder(o, { depositPaid: true, paidInFull: true, stage: 2, updates: [...o.updates, { stage: 2, note: "Paid in full. Mimi is starting.", at: "Today" }] })}>They paid in full</button>
                    <a href={waTo(o.phone, `Hi ${o.name}! I haven’t seen your payment for ${o.id} yet. Could you check?`)} target="_blank" rel="noreferrer" className={linkClass}>Not there yet? Message {o.name}</a>
                  </div>
                </div>
              )}
              {(o.stage === 1 && o.depositPaid) || o.stage === 2 ? (
                <div className="flex flex-col gap-2.5">
                  <Button onClick={() => setMode("update")}>Post an update</Button>
                  <button type="button" className={linkClass} onClick={() => patchOrder(o, { stage: 3, updates: [...o.updates, { stage: 3, note: "All done! Photos on WhatsApp.", at: "Today" }] })}>Or mark it as ready</button>
                </div>
              ) : null}
              {o.stage === 3 && <Button onClick={() => patchOrder(o, { stage: 4, updates: [...o.updates, { stage: 4, note: "Delivered. Enjoy wearing it!", at: "Today" }] })}>Mark as delivered</Button>}

              <div className="flex flex-wrap justify-center gap-x-7">
                <a href={waTo(o.phone, `Hi ${o.name}! About your order ${o.id}…`)} target="_blank" rel="noreferrer" className={linkClass}><WhatsAppIcon size={16} /> Message {o.name}</a>
                <Link href={`/t/${o.code}`} className={linkClass}>Their tracking page</Link>
              </div>

              {o.photos.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] font-semibold">Their photos</span>
                  <div className="flex gap-2">
                    {o.photos.slice(0, 4).map((src, i) => (
                      <span key={i} className="relative h-20 w-[60px] overflow-hidden rounded-[10px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="size-full object-cover" />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <dl className="flex flex-col gap-2 rounded-[16px] bg-white p-4 text-[15px]">
                <div className="flex justify-between gap-4"><dt className="text-stone-500">Delivery</dt><dd className="text-right">{o.area}, {o.state}</dd></div>
                {o.price ? (
                  <>
                    <div className="flex justify-between"><dt className="text-stone-500">Price</dt><dd>{formatNaira(o.price)}</dd></div>
                    {o.paidInFull ? (
                      <div className="flex justify-between"><dt className="text-stone-500">Paid in full</dt><dd>{formatNaira(o.price)} · received</dd></div>
                    ) : (
                      <>
                        <div className="flex justify-between"><dt className="text-stone-500">Deposit (60%)</dt><dd>{formatNaira(deposit)} {o.depositPaid ? "· received" : "· not yet"}</dd></div>
                        <div className="flex justify-between"><dt className="text-stone-500">Balance (40%)</dt><dd>{formatNaira(o.price - deposit)}</dd></div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between"><dt className="text-stone-500">Price</dt><dd>Not set yet</dd></div>
                )}
                {o.readyBy && <div className="flex justify-between"><dt className="text-stone-500">Ready by</dt><dd>{o.readyBy}</dd></div>}
              </dl>

              <div className="flex flex-col gap-1">
                <span className="text-[14px] font-semibold">Updates they can see</span>
                <ol className="flex flex-col">
                  {o.updates.map((u, i) => (
                    <li key={i} className="flex gap-3 border-t border-stone-100 py-2.5 first:border-t-0">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-stone-900" />
                      <span className="flex flex-col"><span className="text-[14px] font-medium">{stages[u.stage].label} · <span className="font-normal text-stone-500">{u.at}</span></span><span className="text-[14px] text-stone-600">{u.note}</span></span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Sheet>
  );
}

/* ------------------------------- the page ------------------------------- */

export function StudioView() {
  const device = useOrders();
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [filter, setFilter] = useState<number | "all" | "late">("all");
  const [open, setOpen] = useState<string | null>(null);

  const rows: Row[] = useMemo(() => {
    const byId = new Map(device.map((o) => [o.id, o]));
    const samples = sampleOrders.map((s) => ({ ...s, ...(byId.get(s.id) ?? {}) }));
    const mine = device.filter((o) => !o.sample && o.kind !== "shop").map((o) => ({ ...o, due: "Just now", dueTone: "normal" as const, ago: "just now" }));
    return [...mine, ...samples].filter((o) => o.stage < 4);
  }, [device]);

  const tasks = rows.filter((r) => r.stage <= 3 && (r.stage === 0 || r.dueTone !== "normal" || (r.stage === 1 && !r.depositPaid)) ).slice(0, 4);
  const shown = rows.filter((r) => (filter === "all" ? true : filter === "late" ? r.dueTone === "late" : r.stage === filter));
  const late = rows.filter((r) => r.dueTone === "late").length;
  const toCollect = rows.reduce((s, r) => s + (r.price && r.depositPaid && !r.paidInFull ? r.price - depositOf(r.price) : 0), 0);
  const current = rows.find((r) => r.id === open);

  if (!hydrated) return <div className="min-h-[70vh]" />;

  return (
    <div className="container-page pt-6 pb-24 lg:pt-12">
      <p className="mb-5 rounded-[12px] border border-dashed border-stone-300 px-4 py-2.5 text-[13px] text-stone-600">
        Studio demo: the orders below are made-up samples, plus any request sent from this device. Changes show on each order’s tracking page here. A real sign-in comes later.
      </p>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-[34px] leading-none tracking-[-0.01em] lg:text-[48px]">{greeting()}</h1>
          <p className="text-[16px] text-stone-600 lg:text-[18px]">
            {rows.filter((r) => r.stage === 0).length} new requests{late ? `, and ${late === 1 ? "one order is" : `${late} orders are`} running late.` : "."}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:mt-8 lg:grid-cols-4 lg:gap-4">
        {[
          ["New requests", rows.filter((r) => r.stage === 0).length, "today", ""],
          ["Due this week", rows.filter((r) => r.dueTone === "soon").length, "orders", ""],
          ["Running late", late, late === 1 ? "order" : "orders", late ? "text-red-700" : ""],
          ["Still to collect", formatNaira(toCollect), "in balances", ""],
        ].map(([k, v, unit, cls]) => (
          <div key={k as string} className={`flex flex-col gap-1 rounded-[18px] bg-white p-4 lg:p-5 ${k === "Still to collect" || k === "Running late" ? "max-lg:hidden" : ""}`}>
            <span className="text-[13px] text-stone-500 lg:text-[14px]">{k}</span>
            <span className="flex items-baseline gap-1.5"><span className={`text-[28px] leading-none font-semibold ${cls}`}>{v}</span><span className="text-[13px] text-stone-500">{unit}</span></span>
          </div>
        ))}
      </div>

      <section className="mt-6 lg:hidden" aria-label="Needs you">
        <h2 className="mb-3 text-[16px] font-semibold">Needs you · {tasks.length}</h2>
        <ul className="flex flex-col gap-2">
          {tasks.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => setOpen(t.id)} className="flex w-full items-center gap-3 rounded-[16px] bg-white p-3.5 text-left">
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

      <div className="no-scrollbar -mx-5 mt-7 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0">
        <Chip on={filter === "all"} onClick={() => setFilter("all")}>All · {rows.length}</Chip>
        {[0, 1, 2, 3].map((s) => (
          <Chip key={s} on={filter === s} onClick={() => setFilter(s)}>{stageName[s]} · {rows.filter((r) => r.stage === s).length}</Chip>
        ))}
        <Chip on={filter === "late"} onClick={() => setFilter("late")}>Late · {late}</Chip>
      </div>

      {/* Phone: rows */}
      <ul className="mt-4 flex flex-col gap-2 lg:hidden">
        {shown.map((o) => (
          <li key={o.id}>
            <button type="button" onClick={() => setOpen(o.id)} className="flex w-full items-center gap-3 rounded-[16px] bg-white p-3 text-left">
              <span className="relative h-[58px] w-11 shrink-0 overflow-hidden rounded-[8px] bg-orange-100">
                {o.piece.image && <Image src={o.piece.image} alt="" fill sizes="44px" className="object-cover" unoptimized={o.piece.image.startsWith("data:")} />}
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
                    <span className="relative h-[42px] w-8 shrink-0 overflow-hidden rounded-[6px] bg-orange-100">
                      {o.piece.image && <Image src={o.piece.image} alt="" fill sizes="32px" className="object-cover" unoptimized={o.piece.image.startsWith("data:")} />}
                    </span>
                    {pieceName(o)}{o.size ? ` · ${o.size}` : ""}
                  </span>
                </td>
                <td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${stageTone[o.stage]}`}>{stageName[o.stage]}</span></td>
                <td className={`px-5 py-3.5 ${dueClass[o.dueTone]}`}>{o.due}</td>
                <td className="px-5 py-3.5 text-stone-500">{o.stage === 0 ? "—" : o.paidInFull ? "In full" : o.stage >= 3 || o.depositPaid ? "Deposit" : "Waiting"}</td>
                <td className="px-5 py-3.5">
                  <button type="button" className="font-semibold underline-offset-4 hover:underline">{nextStep(o)}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[13px] text-stone-500">Open an order to update it. Every change shows up on the customer’s tracking page.</p>

      {current && <OrderPanel key={current.id} o={current} onClose={() => setOpen(null)} />}
    </div>
  );
}
