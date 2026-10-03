"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { findOrder, useOrders } from "@/lib/orders";

export function TrackForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const orders = useOrders();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const mine = orders.slice(0, 3);

  return (
    <div className={compact ? "mt-2 flex w-full flex-col gap-3" : "mt-8 flex w-full max-w-[460px] flex-col gap-4 lg:mx-auto"}>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const raw = value.trim().replace(/^.*\/t\//, "");
          const o = findOrder(orders, raw);
          if (o) router.push(`/t/${o.code}`);
          else setError(true);
        }}
      >
        <label className="flex-1">
          <span className="sr-only">Order number or tracking code</span>
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder="e.g. MIMI-2406"
            className={`${compact ? "h-12" : "h-[54px]"} w-full rounded-full border border-stone-300 bg-white px-5 text-[16px] outline-none focus:border-stone-900`}
            aria-invalid={error}
          />
        </label>
        <Button type="submit" size={compact ? "sm" : "md"} className={compact ? "h-12 px-5" : ""}>Track</Button>
      </form>
      {error && (
        <p className="text-left text-[14px] text-red-700" role="alert">
          We can’t find that order on this phone. Open the link Mimi sent you, or try MIMI-2406 to see an example.
        </p>
      )}
      {mine.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 text-left">
          <span className="text-[14px] font-medium text-stone-500">Your orders on this phone</span>
          {mine.map((o) => (
            <Link key={o.id} href={`/t/${o.code}`} className="flex items-center justify-between rounded-[16px] bg-white px-4 py-3 text-[15px] hover:bg-orange-100/60">
              <span className="font-medium">{o.piece.name}</span>
              <span className="text-stone-500">{o.id}</span>
            </Link>
          ))}
        </div>
      )}
      <Link href="/t/k7x2p9" className="text-[15px] font-medium underline underline-offset-4">
        See an example order
      </Link>
    </div>
  );
}
