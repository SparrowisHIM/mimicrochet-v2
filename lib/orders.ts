"use client";

import { useSyncExternalStore } from "react";
import type { PieceKind } from "@/lib/fit-outline";
import { makeCode } from "@/lib/order-code";

// The orders this device knows: a copy of each order made here (the server holds the real one, see
// lib/server/orders.ts), orders the server couldn't save, and the example order MIMI-2406, which is
// always available so the tracking page and Mimi's page can be explored.

export type OrderUpdate = { stage: number; note: string; at: string; photo?: string };

export type Order = {
  /** custom: made for you (5 stages). shop: ready pieces paid at checkout (4 stages). */
  kind?: "custom" | "shop";
  items?: { slug: string; name: string; image: string; price: number; size?: string }[];
  email?: string;
  id: string; // MIMI-2406
  code: string; // private tracking code, e.g. k7x2p9
  createdAt: string;
  piece: { name: string; image?: string; slug?: string; source: "product" | "idea" | "story" | "photo" | "words"; price?: number | null; note?: string };
  /** What it is, when it started from their own photo or words. See lib/fit-outline.ts. */
  pieceKind?: PieceKind;
  photos: string[]; // small data-URL previews of the customer's photos
  hasVoiceNote?: boolean;
  description?: string;
  size?: string;
  measurements?: { bust?: number; waist?: number; hips?: number; length?: number; unit: "cm" | "in" };
  /** Their height in cm, from the fit questions. */
  height?: number;
  /** How it should fit: x tight (-2) to loose (+2), y short (-2) to long (+2). See lib/fit.ts. */
  fit?: { x: number; y: number };
  colours: "photo" | "different";
  colourNote?: string;
  when: string; // "No rush" or a date label
  budget?: string;
  notes?: string;
  name: string;
  phone: string;
  state: string;
  area: string;
  stage: number;
  updates: OrderUpdate[];
  price?: number;
  readyBy?: string;
  depositPaid?: boolean;
  /** Paid the whole price up front instead of the 60% deposit, so nothing is left when it's ready. */
  paidInFull?: boolean;
  /** The customer tapped "I've paid" on their page, and which amount they sent. Mimi still confirms it. */
  paymentSent?: "deposit" | "full";
  sample?: boolean;
  /** Saved on the server, so its tracking link opens on any phone (not only this device). */
  onServer?: boolean;
  /** Mimi's studio: where the customer's voice note plays from. */
  voiceNote?: string;
  /** Custom requests: false until the customer taps Send on WhatsApp (Mimi only gets it then). */
  sent?: boolean;
};

export { depositOf } from "@/lib/order-code";

const KEY = "mimi:orders";
const listeners = new Set<() => void>();
let cache: Order[] | null = null;

export const demoOrder: Order = {
  id: "MIMI-2406",
  code: "k7x2p9",
  createdAt: "2026-10-02",
  piece: { name: "Ruby Dress", image: "/images/products/red-fringe-beach-set-1.jpg", slug: "red-fringe-beach-set", source: "product", price: 40000 },
  photos: ["/images/story/hero-ruby.jpg"],
  size: "L",
  colours: "photo",
  when: "No rush",
  name: "Amara",
  phone: "+234 801 234 5678",
  state: "Rivers",
  area: "GRA Phase 2, Port Harcourt",
  stage: 2,
  price: 45000,
  readyBy: "Fri 16 Oct",
  depositPaid: true,
  sample: true,
  updates: [
    { stage: 0, note: "Request sent with your size and colours.", at: "2 Oct" },
    { stage: 1, note: "Price agreed with Mimi on WhatsApp.", at: "3 Oct" },
    { stage: 2, note: "The top is done. Starting the skirt now.", at: "Today", photo: "/images/story/ruby-taking-shape.jpg" },
  ],
};

function read(): Order[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as Order[];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: Order[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full (large photos): keep in memory for this visit
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const empty: Order[] = [];

export function useOrders(): Order[] {
  return useSyncExternalStore(subscribe, read, () => empty);
}

/** Device copies win over the built-in example, so edits made on Mimi's page show on the tracking link. */
export function findOrder(orders: Order[], codeOrId: string) {
  const q = codeOrId.trim().toLowerCase();
  return [...orders, demoOrder].find((o) => o.code === q || o.id.toLowerCase() === q);
}

/** Change an order (a real one or an example) and keep it on this device. */
export function patchOrder(o: Order, patch: Partial<Order>) {
  saveOrder({ ...o, ...patch });
}

export function saveOrder(o: Order) {
  write([o, ...read().filter((x) => x.id !== o.id)]);
}

export function updateOrder(id: string, patch: Partial<Order>) {
  write(read().map((o) => (o.id === id ? { ...o, ...patch } : o)));
}

/** One unbiased random number below n from the browser's secure random source (never Math.random). */
function randomBelow(n: number) {
  const limit = 256 - (256 % n);
  for (;;) {
    const [b] = crypto.getRandomValues(new Uint8Array(1));
    if (b < limit) return b % n;
  }
}

/**
 * Numbers for an order the server couldn't save (it still goes to Mimi on WhatsApp, tracked on this
 * phone only). They come from 9000 up, far past the server's own count (from 2412), so a phone-only
 * order can never share a number with a real one.
 */
export function newOrderIds() {
  const n = randomBelow(250) * 4 + randomBelow(4); // 0 to 999, every number equally likely
  return { id: `MIMI-${9000 + n}`, code: makeCode(randomBelow) };
}

export { nigerianStates } from "@/lib/nigeria";
