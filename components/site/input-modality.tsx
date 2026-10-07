"use client";

import { useEffect } from "react";

// Remembers whether the last input was a pointer (mouse, touch, pen) or a navigation key, on <html
// data-input>. globals.css hides the focus ring after pointer use, so clicking never leaves a ring.
const NAVIGATION = new Set(["Tab", "Enter", " ", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"]);

export function InputModality() {
  useEffect(() => {
    const root = document.documentElement;
    const pointer = () => {
      root.dataset.input = "pointer";
    };
    const key = (e: KeyboardEvent) => {
      if (NAVIGATION.has(e.key) && !e.isComposing) root.dataset.input = "keyboard";
    };
    window.addEventListener("pointerdown", pointer, true);
    window.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("pointerdown", pointer, true);
      window.removeEventListener("keydown", key, true);
    };
  }, []);
  return null;
}
