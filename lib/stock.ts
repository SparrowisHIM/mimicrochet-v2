"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { stockFor } from "@/app/actions/orders";
import { asMadeForYou, products, type Product } from "@/lib/products";

// Which one-of-one pieces have sold, so the shop and Home can show them as made for you instead of
// Ready now. Asked once for the whole page (not once per card), and again when the customer comes back
// to the tab a while later.

const oneOfOnes = products.filter((p) => p.kind === "ready").map((p) => p.slug);
let sold: ReadonlySet<string> = new Set();
let askedAt = 0;
const listeners = new Set<() => void>();
const none: ReadonlySet<string> = new Set();

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

/** The slugs the server says have sold (empty while asking, and on the server). */
export function useSoldSlugs() {
  useEffect(ask, []);
  return useSyncExternalStore(subscribe, () => sold, () => none);
}

/** This piece as customers should see it now: a sold one-of-one becomes made for you. */
export function useLiveProduct(p: Product) {
  const soldNow = useSoldSlugs().has(p.slug) && p.kind === "ready";
  return useMemo(() => (soldNow ? asMadeForYou(p) : p), [p, soldNow]);
}

/** A list of pieces as customers should see them now (for filters, counts and the Ready now toggle). */
export function useLiveProducts(list: Product[] = products) {
  const soldNow = useSoldSlugs();
  return useMemo(() => (soldNow.size ? list.map((p) => (p.kind === "ready" && soldNow.has(p.slug) ? asMadeForYou(p) : p)) : list), [list, soldNow]);
}
