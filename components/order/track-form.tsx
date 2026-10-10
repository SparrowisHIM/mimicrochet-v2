"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { findOrderCode } from "@/app/actions/orders";
import { Field, inputClass } from "@/components/form/fields";
import { Button } from "@/components/ui/button";
import { findOrder, useOrders } from "@/lib/orders";

// Find an order from any phone with its number and the last 4 digits of the phone number on it.
// Orders kept only on this phone (and the example order) are found here first; the rest are asked
// of the server, which never opens an order from its number alone.

const codeShape = /^[a-hj-km-np-z2-9]{8}$/;

export function TrackForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const orders = useOrders();
  const [number, setNumber] = useState("");
  const [last4, setLast4] = useState("");
  const [tried, setTried] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [looking, setLooking] = useState(false);

  const mine = orders.filter((o) => !o.sample).slice(0, 3);
  // A tracking link or code pasted into the number box opens straight away.
  const pasted = number.trim().replace(/^.*\/t\//, "").replace(/[/?#].*$/, "").toLowerCase();
  const numberMissing = !codeShape.test(pasted) && !/\d{3,}/.test(number);
  const last4Missing = !codeShape.test(pasted) && !/^\d{4}$/.test(last4);
  const show = tried > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (looking) return;
    setNotFound(false);
    if (codeShape.test(pasted)) return router.push(`/t/${pasted}`);
    setTried((t) => t + 1);
    if (numberMissing || last4Missing) return;
    const digits = number.replace(/\D/g, "");
    const local = findOrder(orders, `MIMI-${digits}`);
    if (local && local.phone.replace(/\D/g, "").endsWith(last4)) return router.push(`/t/${local.code}`);
    setLooking(true);
    const code = await findOrderCode(number, last4).catch(() => null);
    setLooking(false);
    if (code) router.push(`/t/${code}`);
    else setNotFound(true);
  };

  return (
    <div className={compact ? "mt-2 flex w-full flex-col gap-3" : "mt-8 flex w-full max-w-[460px] flex-col gap-4 text-left lg:mx-auto"}>
      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <div className={compact ? "flex flex-col gap-3" : "flex flex-col gap-4 lg:flex-row lg:gap-3 [&>*]:flex-1"}>
          <Field label="Order number" htmlFor={compact ? "track-number-c" : "track-number"} error={show && numberMissing ? "Add your order number, like MIMI-2406." : null} shake={tried}>
            <input
              id={compact ? "track-number-c" : "track-number"}
              value={number}
              onChange={(e) => {
                setNumber(e.target.value.slice(0, 60));
                setNotFound(false);
              }}
              placeholder="e.g. MIMI-2406"
              autoComplete="off"
              autoCapitalize="characters"
              className={inputClass}
              aria-invalid={show && numberMissing}
            />
          </Field>
          <Field label="Last 4 digits of your phone" htmlFor={compact ? "track-last4-c" : "track-last4"} error={show && last4Missing ? "Add the last 4 digits of your phone number." : null} shake={tried}>
            <input
              id={compact ? "track-last4-c" : "track-last4"}
              value={last4}
              onChange={(e) => {
                setLast4(e.target.value.replace(/\D/g, "").slice(0, 4));
                setNotFound(false);
              }}
              placeholder="e.g. 5678"
              inputMode="numeric"
              autoComplete="off"
              className={inputClass}
              aria-invalid={show && last4Missing}
            />
          </Field>
        </div>
        <Button type="submit" className="w-full" disabled={looking} aria-busy={looking}>
          Track
        </Button>
      </form>
      {notFound && (
        <p className="text-[14px] text-red-700" role="alert">
          No order has that number and those 4 digits. Check both, or ask Mimi on WhatsApp.
        </p>
      )}
      {mine.length > 0 && (
        <div className="flex flex-col gap-2 pt-2">
          <span className="text-[14px] font-medium text-stone-500">Your orders on this phone</span>
          {mine.map((o) => (
            <Link key={o.id} href={`/t/${o.code}`} className="flex items-center justify-between rounded-[14px] bg-white px-4 py-3 text-[15px] transition-colors duration-150 hover:bg-orange-100/60">
              <span className="font-medium">{o.piece.name}</span>
              <span className="text-stone-500">{o.id}</span>
            </Link>
          ))}
        </div>
      )}
      <Link href="/t/k7x2p9" className={`text-[15px] font-medium underline underline-offset-4 ${compact ? "" : "lg:self-center"}`}>
        See an example order
      </Link>
    </div>
  );
}
