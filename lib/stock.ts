"use client";

import { useEffect, useSyncExternalStore } from "react";
import { stockFor } from "@/app/actions/orders";
import { products } from "@/lib/products";

// Which one-of-one pieces have sold, for the cards in the shop and on Home. Asked once for the whole
// page (not once per card), and again when the customer comes back to the tab a while later.

const oneOfOnes = products.filter((p) => p.kind === "ready").map((p) => p.slug);
let sold = new Set<string>();
let askedAt = 0;
const listeners = new Set<() => void>();

/** Asks the server, at most every 30 seconds; every card on the page updates from the one answer. */
function ask() {
  if (Date.now() - askedAt < 30_000) return;
  askedAt = Date.now();
  stockFor(oneOfOnes)
    .then((r) => {
      sold = new Set(r.sold);
      listeners.forEach((l) => l());
    })
    .catch(() => {});
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onShow = () => document.visibilityState === "visible" && ask();
  document.addEventListener("visibilitychange", onShow);
  return () => {
    listeners.delete(onChange);
    document.removeEventListener("visibilitychange", onShow);
  };
}

/** True once the server says this piece has sold (false while asking, and on the server). */
export function useSold(slug: string) {
  useEffect(ask, []);
  return useSyncExternalStore(subscribe, () => sold.has(slug), () => false);
}
