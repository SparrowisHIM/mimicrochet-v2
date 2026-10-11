"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Pages that show live orders (the customer's order page, Mimi's studio) fetch the latest from the server
 * whenever someone comes back to them: back from another app or tab, or after unlocking the phone. A page
 * left open shows what was true when it loaded, and a home-screen app has no pull-to-refresh.
 */
export function useFreshOnReturn(enabled = true) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    let last = Date.now();
    const back = () => {
      // At most every few seconds: focus and visibility often fire together.
      if (document.visibilityState !== "visible" || Date.now() - last < 4000) return;
      last = Date.now();
      router.refresh();
    };
    document.addEventListener("visibilitychange", back);
    window.addEventListener("focus", back);
    window.addEventListener("pageshow", back);
    return () => {
      document.removeEventListener("visibilitychange", back);
      window.removeEventListener("focus", back);
      window.removeEventListener("pageshow", back);
    };
  }, [enabled, router]);
}
