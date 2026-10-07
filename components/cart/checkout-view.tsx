"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, useSyncExternalStore } from "react";
import { ShopOrderCard } from "@/components/cart/shop-order-card";
import { Button, ButtonLink, linkClass } from "@/components/ui/button";
import { CardStack } from "@/components/ui/card-stack";
import { Confetti } from "@/components/ui/confetti";
import { bagTotal, useBagItems } from "@/lib/bag";
import { bagStore } from "@/lib/local-store";
import { Field, inputClass, NameInput, PhoneInput, useNudge } from "@/components/form/fields";
import { AreaPicker, StatePicker } from "@/components/form/place-picker";
import { isLgaOf, isNigerianState } from "@/lib/nigeria";
import { newOrderIds, saveOrder, type Order } from "@/lib/orders";
import { formatNaira } from "@/lib/site";
import { fullPhone, hasWords, isEmail, isName, phoneDigits, phoneProblem } from "@/lib/validate";

const ease = [0.22, 1, 0.36, 1] as const;
function Num({ n }: { n: number }) {
  return <span className="grid size-6 place-items-center rounded-full bg-stone-900 text-[13px] font-semibold text-orange-50">{n}</span>;
}

export function CheckoutView() {
  const items = useBagItems();
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);
  const total = bagTotal(items);
  const [f, setF] = useState({ name: "", phone: "", email: "", state: "", area: "", address: "", note: "" });
  const [tried, setTried] = useState(0);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [nameNudge, nudgeName] = useNudge();
  const [phoneNudge, nudgePhone] = useNudge();
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState<Order | null>(null);
  const [showItems, setShowItems] = useState(false);
  const put = (patch: Partial<typeof f>) => setF((c) => ({ ...c, ...patch }));
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  const phoneErr = phoneProblem(f.phone);
  const bad = {
    name: !isName(f.name),
    phone: Boolean(phoneErr),
    email: !isEmail(f.email),
    state: !isNigerianState(f.state),
    area: !isLgaOf(f.state, f.area),
    address: !hasWords(f.address, 6),
  };
  const ok = !Object.values(bad).some(Boolean);
  const show = (k: keyof typeof bad) => (tried > 0 || Boolean(touched[k])) && bad[k];

  const pay = async () => {
    if (paying) return;
    if (!ok) {
      setTried((n) => n + 1);
      const first = (Object.keys(bad) as (keyof typeof bad)[]).find((k) => bad[k]);
      const el = first ? document.getElementById(`co-${first}`) : null;
      el?.focus({ preventScroll: true });
      // Scroll once the error messages have opened: their growth above the Pay button makes the
      // browser re-anchor the page, which cancels a smooth scroll started straight away.
      setTimeout(() => el?.scrollIntoView({ behavior: "smooth", block: "center" }), 240);
      return;
    }
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1300));
    const { id, code } = newOrderIds();
    const order: Order = {
      kind: "shop",
      id,
      code,
      createdAt: new Date().toISOString(),
      items: items.map((p) => ({ slug: p.slug, name: p.name, image: p.images[0], price: p.price!, size: p.size ?? p.leadTime })),
      piece: { name: items.map((i) => i.name).join(" and "), image: items[0]?.images[0], source: "product" },
      photos: [],
      colours: "photo",
      when: "No rush",
      name: f.name.trim(),
      phone: fullPhone(phoneDigits(f.phone)),
      email: f.email.trim(),
      state: f.state,
      area: `${f.address.trim()}, ${f.area}`,
      notes: f.note.trim() || undefined,
      stage: 0,
      price: total,
      updates: [{ stage: 0, note: "Paid. Mimi is packing your order.", at: "Today" }],
    };
    saveOrder(order);
    bagStore.clear();
    setPaying(false);
    setPaid(order);
    window.scrollTo({ top: 0 });
  };

  if (!hydrated) return <div className="min-h-[70vh]" />;
  if (paid) return <Paid order={paid} />;
  if (items.length === 0)
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-start justify-center gap-4 py-16 lg:items-center lg:text-center">
        <h1 className="font-serif text-[40px] leading-tight lg:text-[56px]">Your bag is empty</h1>
        <p className="text-[17px] text-stone-600">Every piece is one of one. Find yours, then come back here to pay.</p>
        <ButtonLink href="/shop">Shop the collection</ButtonLink>
      </div>
    );

  const list = (
    <ul className="flex flex-col">
      {items.map((p) => (
        <li key={p.slug} className="flex items-center gap-3.5 border-t border-stone-200/80 py-4 first:border-t-0">
          <span className="relative h-[72px] w-[54px] shrink-0 overflow-hidden rounded-[10px] bg-orange-100">
            <Image src={p.images[0]} alt="" fill sizes="54px" className="object-cover" />
          </span>
          <span className="flex flex-1 flex-col">
            <span className="text-[15px] font-medium">{p.name}</span>
            <span className="text-[13px] text-stone-500">{p.size ? `${p.size === "One size" ? "One size" : `Size ${p.size}`} · the only one` : p.leadTime}</span>
          </span>
          <span className="text-[15px] font-semibold">{formatNaira(p.price!)}</span>
        </li>
      ))}
    </ul>
  );

  const totals = (
    <dl className="flex flex-col gap-2 text-[15px]">
      <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd>{formatNaira(total)}</dd></div>
      <div className="flex justify-between"><dt className="text-stone-500">Delivery</dt><dd>Paid to the rider</dd></div>
      <div className="flex justify-between border-t border-stone-200 pt-3 text-[18px] font-semibold"><dt>Total</dt><dd>{formatNaira(total)}</dd></div>
    </dl>
  );

  return (
    <div className="container-page flex flex-col gap-8 pt-6 pb-20 lg:flex-row lg:gap-16 lg:pt-12 lg:pb-28">
      {/* Summary (Clerk-style: one big total, then the items) */}
      <div className="flex flex-col gap-5 lg:flex-1 lg:pt-4">
        <h1 className="font-serif text-[36px] leading-none tracking-[-0.01em] lg:text-[48px]">Checkout</h1>
        <div className="hidden flex-col gap-1 lg:flex">
          <span className="text-[15px] text-stone-500">Total to pay</span>
          <span className="flex items-baseline gap-2.5">
            <span className="text-[56px] leading-none font-semibold tracking-[-0.02em]">{formatNaira(total)}</span>
            <span className="text-[17px] text-stone-500">today</span>
          </span>
          <span className="pt-1 text-[16px] text-stone-600">For {items.length} {items.length === 1 ? "piece" : "pieces"}. Delivery is paid to the rider when it arrives.</span>
        </div>
        <div className="hidden lg:block">{list}</div>
        <div className="hidden lg:block">{totals}</div>
        <p className="hidden rounded-[14px] bg-amber-100 px-4 py-3 text-[14px] text-amber-800 lg:block">Mimi packs your order within 2 days. You’ll get a tracking link right after paying.</p>

        <div className="rounded-[18px] bg-white p-4 lg:hidden">
          <button type="button" onClick={() => setShowItems((v) => !v)} className="group flex w-full items-center gap-3 text-left" aria-expanded={showItems}>
            <CardStack images={items.map((p) => p.images[0])} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[15px] font-semibold">{items.length} {items.length === 1 ? "piece" : "pieces"}</span>
              <span className="truncate text-[13px] text-stone-500">{items.map((i) => i.name).join(" and ")}</span>
            </span>
            <span className="text-[14px] font-medium underline underline-offset-4">{showItems ? "Hide" : "Show"}</span>
          </button>
          <AnimatePresence initial={false}>
            {showItems && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-2">
                {list}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Form */}
      <motion.form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          pay();
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease, delay: 0.08 }}
        className="flex flex-col gap-7 lg:w-[520px] lg:rounded-[28px] lg:bg-white lg:p-8 lg:shadow-[0_24px_60px_-20px_rgb(28_25_23/0.18)]"
      >
        <fieldset className="flex flex-col gap-5">
          <legend className="mb-4 flex items-center gap-2.5 text-[17px] font-semibold"><Num n={1} /> Your details</legend>
          <Field label="Your name" htmlFor="co-name" error={show("name") ? "Add your name, using letters only." : null} nudge={nameNudge} shake={tried}>
            <NameInput id="co-name" value={f.name} onChange={(name) => put({ name })} onBlur={blur("name")} invalid={show("name")} onNudge={nudgeName} />
          </Field>
          <Field label="WhatsApp number" htmlFor="co-phone" hint="Mimi and the rider use this to reach you." error={show("phone") ? phoneErr : null} nudge={phoneNudge} shake={tried}>
            <PhoneInput id="co-phone" value={f.phone} onChange={(phone) => put({ phone })} onBlur={blur("phone")} invalid={show("phone")} onNudge={nudgePhone} />
          </Field>
          <Field label="Email" htmlFor="co-email" hint="For your receipt." error={show("email") ? "Add an email like name@example.com." : null} shake={tried}>
            <input id="co-email" type="email" inputMode="email" autoComplete="email" className={inputClass} value={f.email} onChange={(e) => put({ email: e.target.value.replace(/\s/g, "") })} onBlur={blur("email")} aria-invalid={show("email")} />
          </Field>
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="mb-4 flex items-center gap-2.5 text-[17px] font-semibold"><Num n={2} /> Delivery</legend>
          <div className="rounded-[14px] bg-amber-100 px-4 py-3 text-[14px] leading-[1.45] text-amber-800">
            <p className="font-semibold">Delivery anywhere in Nigeria</p>
            Mimi passes your number to a rider. You pay the rider for delivery when it arrives.
          </div>
          <Field label="State" htmlFor="co-state" error={show("state") ? "Choose your state from the list." : null} shake={tried}>
            <StatePicker id="co-state" value={f.state} onChange={(state) => put({ state, area: isLgaOf(state, f.area) ? f.area : "" })} invalid={show("state")} />
          </Field>
          <Field label="Area" htmlFor="co-area" hint="Your local government area. Search by town too, like Lekki or Rumuola." error={!bad.state && show("area") ? "Choose your area from the list." : null} shake={tried}>
            <AreaPicker id="co-area" state={f.state} value={f.area} onChange={(area) => put({ area })} invalid={!bad.state && show("area")} />
          </Field>
          <Field label="Street address" htmlFor="co-address" hint="House number, street and a landmark the rider can find." error={show("address") ? "Add your street address so the rider can find you." : null} shake={tried}>
            <input id="co-address" autoComplete="street-address" className={inputClass} placeholder="e.g. 12 Woji Road, by the filling station" value={f.address} onChange={(e) => put({ address: e.target.value.slice(0, 120) })} onBlur={blur("address")} aria-invalid={show("address")} />
          </Field>
          <Field label="Note for the rider (optional)" htmlFor="co-note">
            <input id="co-note" className={inputClass} placeholder="e.g. Call when you’re at the gate" value={f.note} onChange={(e) => put({ note: e.target.value.slice(0, 120) })} />
          </Field>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 flex items-center gap-2.5 text-[17px] font-semibold"><Num n={3} /> Payment</legend>
          <div className="rounded-[14px] bg-stone-100 px-4 py-3.5">
            <p className="text-[15px] font-semibold">Pay securely with Paystack</p>
            <p className="text-[13px] text-stone-500">Card, bank transfer or USSD. Mimi never sees your card details.</p>
          </div>
          <div className="lg:hidden">{totals}</div>
          <p className="rounded-[12px] border border-dashed border-stone-300 px-3.5 py-2.5 text-[13px] text-stone-600">
            Test mode: payments aren’t switched on yet, so nothing is charged.
          </p>
          {/* Not `disabled` while paying: that would fade it to grey. pay() already ignores repeat taps. */}
          <Button type="submit" aria-disabled={paying} arrow={!paying} className="w-full">
            {paying ? (
              <span className="flex items-center gap-2.5">
                <motion.span className="size-4 rounded-full border-2 border-orange-50/40 border-t-orange-50" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
                Opening Paystack…
              </span>
            ) : (
              `Pay ${formatNaira(total)}`
            )}
          </Button>
          {tried > 0 && !ok && <p className="text-[14px] text-red-700" role="alert">Fill in the fields marked in red to continue.</p>}
          <p className="text-[13px] text-stone-500">By paying, you agree to Mimi’s returns policy: if your piece arrives damaged or isn’t what you ordered, she’ll make it right.</p>
        </fieldset>
      </motion.form>
    </div>
  );
}

function Paid({ order }: { order: Order }) {
  const reduce = useReducedMotion();
  const host = useSyncExternalStore(() => () => {}, () => window.location.host, () => "");
  return (
    <div className="container-page flex justify-center pt-8 pb-20 lg:pt-16">
      <div className="flex w-full max-w-[560px] flex-col gap-6">
        <motion.span className="relative grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-800" initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 18 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <motion.path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.15 }} />
          </svg>
          <Confetti />
        </motion.span>
        <div className="flex flex-col gap-3">
          <h1 className="font-serif text-[36px] leading-[1.05] lg:text-[52px]">Paid! It’s all yours.</h1>
          <p className="text-[16px] leading-[1.5] text-stone-600 lg:text-[18px]">Mimi is packing your order and will pass your number to a rider. Your order number is <span className="whitespace-nowrap">{order.id}</span>, and your receipt is below.</p>
        </div>
        <ShopOrderCard order={order} />
        <div className="flex flex-col gap-2 rounded-[22px] border border-stone-200 bg-white p-5">
          <span className="text-[15px] font-semibold">Your tracking link</span>
          <Link href={`/t/${order.code}`} className="text-[16px] font-medium underline-offset-4 hover:underline">
            {host}/t/{order.code}
          </Link>
          <span className="text-[14px] text-stone-500">Save it. It shows every step, from today to your door.</span>
        </div>
        <div className="flex flex-col gap-2 rounded-[22px] border border-stone-200 bg-white p-5 text-[15px]">
          <span className="font-semibold">Receipt</span>
          {order.items?.map((i) => (
            <div key={i.slug} className="flex justify-between"><span className="text-stone-600">{i.name}</span><span>{formatNaira(i.price)}</span></div>
          ))}
          <div className="flex justify-between"><span className="text-stone-600">Delivery</span><span>Paid to the rider</span></div>
          <div className="flex justify-between border-t border-stone-100 pt-2 font-semibold"><span>Paid with Paystack</span><span>{formatNaira(order.price!)}</span></div>
        </div>
        <Link href="/shop" className={`${linkClass} self-center`}>Back to the shop</Link>
      </div>
    </div>
  );
}
