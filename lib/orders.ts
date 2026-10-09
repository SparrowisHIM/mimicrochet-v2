"use client";

import { useSyncExternalStore } from "react";

// Prototype order store: orders live on this device (no backend yet). The demo order
// MIMI-2406 is always available so the tracking page and Mimi's page can be explored.

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
  photos: string[]; // small data-URL previews of the customer's photos
  hasVoiceNote?: boolean;
  description?: string;
  size?: string;
  measurements?: { bust?: number; waist?: number; hips?: number; length?: number; unit: "cm" | "in" };
  /** Their height in cm, from the fit questions. */
  height?: number;
  /** How it should fit: x snug (-2) to relaxed (+2), y shorter (-2) to longer (+2). See lib/fit.ts. */
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
  /** Custom requests: false until the customer taps Send on WhatsApp (Mimi only gets it then). */
  sent?: boolean;
};

/** Custom orders start with a 60% deposit and the other 40% when it's ready, or the full price up front. */
export const depositOf = (price: number) => Math.round(price * 0.6);

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

export function newOrderIds() {
  const n = 2412 + Math.floor(Math.random() * 400);
  // The tracking code is the key to a private page (name, phone, address), so it comes from the
  // browser's secure random source, never Math.random, and is long enough that guessing one is hopeless.
  // Letters and numbers that look alike (i, l, o, 0, 1) are left out so it's easy to read out.
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  while (code.length < 8) {
    for (const b of crypto.getRandomValues(new Uint8Array(16))) {
      // Bytes past the last whole run of the alphabet are skipped, so every character is equally likely.
      if (b < 256 - (256 % alphabet.length) && code.length < 8) code += alphabet[b % alphabet.length];
    }
  }
  return { id: `MIMI-${n}`, code };
}

export const trackingUrl = (code: string) => `mimicrochet.ng/t/${code}`;

export { nigerianStates } from "@/lib/nigeria";
