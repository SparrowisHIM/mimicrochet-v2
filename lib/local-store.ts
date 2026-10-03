"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny list store kept in localStorage and shared across components.
 * Used for Saved pieces and the Bag: no account, it lives on this device.
 */
export function createListStore(key: string) {
  const listeners = new Set<() => void>();
  let cache: string[] | null = null;
  const empty: string[] = [];

  function read(): string[] {
    if (cache) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      cache = [];
    }
    return cache;
  }

  function write(next: string[]) {
    cache = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Private mode or storage full: keep the in-memory copy.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        cache = null;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    useList() {
      return useSyncExternalStore(subscribe, read, () => empty);
    },
    has: (id: string) => read().includes(id),
    toggle(id: string) {
      const list = read();
      write(list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]);
    },
    add(id: string) {
      const list = read();
      if (!list.includes(id)) write([...list, id]);
    },
    remove(id: string) {
      write(read().filter((x) => x !== id));
    },
    clear() {
      write([]);
    },
  };
}

export const savedStore = createListStore("mimi:saved");
export const bagStore = createListStore("mimi:bag");
