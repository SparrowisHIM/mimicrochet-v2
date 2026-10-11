"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, type MouseEvent } from "react";

/*
 * Back means back. The site remembers the pages visited in this tab, so a way out ("Exit", the first
 * "Back") returns to the page the customer came from instead of the home page. And an open layer (a
 * sheet, the phone menu, a customer's story) takes one step in the browser's history, so the phone's
 * Back gesture closes it instead of leaving the page.
 */

const pages: string[] = [];
const ahead: string[] = [];
let traversing = false;
const openLayers = new Set<string>();
let pendingBack: ReturnType<typeof setTimeout> | undefined;
let followingLink = false;

if (typeof window !== "undefined")
  window.addEventListener("popstate", () => {
    if (window.location.pathname !== pages.at(-1)) traversing = true;
    const layer = (window.history.state as { layer?: string } | null)?.layer;
    // A layer's step that outlived it (a link inside it was followed): step over it, so Back isn't needed twice.
    if (layer && !openLayers.has(layer)) window.history.back();
  });

/** Called on every page change (see NavMemory). */
export function rememberPage(path: string) {
  if (pages.at(-1) === path) return;
  if (traversing) {
    traversing = false;
    if (pages.at(-2) === path) return void ahead.push(pages.pop()!);
    if (ahead.at(-1) === path) return void pages.push(ahead.pop()!);
    // Somewhere we can't place: nothing known behind it.
    pages.length = ahead.length = 0;
  } else ahead.length = 0;
  pages.push(path);
}

/** A page of this site is one step back in this tab. */
export const canGoBack = () => pages.length > 1;

/** Back to the page they came from; to `fallback` when they arrived here first (a shared link, a new tab). */
export function useBack(fallback: string) {
  const router = useRouter();
  return () => (canGoBack() ? router.back() : router.push(fallback));
}

/** For a Link that leaves: it goes back when it can, and stays a real link (to `fallback`) otherwise. */
export function useBackLink(fallback: string) {
  const router = useRouter();
  return {
    href: fallback,
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !canGoBack()) return;
      e.preventDefault();
      router.back();
    },
  };
}

/** While `open`, the phone's Back closes this layer. Closed any other way, its history step comes back off. */
export function useBackCloses(open: boolean, onClose: () => void) {
  const close = useEffectEvent(onClose);
  useEffect(() => {
    if (!open) return;
    const mark = Math.random().toString(36).slice(2);
    followingLink = false;
    if (pendingBack !== undefined) {
      // One layer closing as another opens (the menu handing over to the bag): the new one takes its step.
      clearTimeout(pendingBack);
      pendingBack = undefined;
      window.history.replaceState({ layer: mark }, "");
    } else window.history.pushState({ layer: mark }, "");
    openLayers.add(mark);
    let popped = false;
    const onPop = () => {
      if ((window.history.state as { layer?: string } | null)?.layer === mark) return;
      popped = true;
      close();
    };
    // A link inside the layer is about to open a page: its step stays put, and Back steps over it later.
    const onLink = (e: globalThis.MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("a[href]:not([target])")) followingLink = true;
    };
    window.addEventListener("popstate", onPop);
    document.addEventListener("click", onLink, true);
    return () => {
      openLayers.delete(mark);
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onLink, true);
      if (popped || (window.history.state as { layer?: string } | null)?.layer !== mark) return;
      if (followingLink) return void (followingLink = false);
      pendingBack = setTimeout(() => {
        pendingBack = undefined;
        window.history.back();
      }, 0);
    };
  }, [open]);
}
