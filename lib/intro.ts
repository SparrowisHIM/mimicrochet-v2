import { useSyncExternalStore } from "react";

// The loading screen (components/site/intro.tsx) covers the first page of a visit for 2.5s. Load-in
// animations wait for it to lift, so people see them play instead of them finishing underneath.

const listeners = new Set<() => void>();
let lifted = false;

/** Called by the loading screen as it starts to lift (or when it isn't playing at all). */
export function introLifted() {
  if (lifted) return;
  lifted = true;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
// Nothing to wait for once it has lifted, or when this page load doesn't show it (later loads in a visit).
const snapshot = () => {
  if (lifted) return true;
  const el = document.getElementById("intro");
  return !el || el.hidden;
};

/** False while the loading screen still covers the page. */
export function useIntroDone() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
