"use client";

import { useSyncExternalStore } from "react";
import { bagStore } from "@/lib/local-store";
import { getProduct, type Product } from "@/lib/products";

// Bag drawer open/closed state, shared between the header, product pages and the drawer.
let open = false;
let lastAdded: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const bagUi = {
  open(added?: string) {
    open = true;
    lastAdded = added ?? null;
    emit();
  },
  close() {
    open = false;
    emit();
  },
  useOpen() {
    return useSyncExternalStore(
      (l) => {
        listeners.add(l);
        return () => listeners.delete(l);
      },
      () => open,
      () => false,
    );
  },
  lastAdded: () => lastAdded,
};

/** Add a piece and show the bag. Each piece is one of one, so it's never added twice. */
export function addToBag(slug: string) {
  bagStore.add(slug);
  bagUi.open(slug);
}

export function useBagItems(): Product[] {
  return bagStore
    .useList()
    .map((s) => getProduct(s))
    .filter((p): p is Product => Boolean(p && p.price !== null));
}

export function bagTotal(items: Product[]) {
  return items.reduce((sum, p) => sum + (p.price ?? 0), 0);
}
