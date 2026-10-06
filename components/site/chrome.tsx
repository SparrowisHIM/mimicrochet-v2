"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Pages that are a focused task get their own slim header (logo, step, Exit) instead of the site menu.
const focused = ["/custom-order"];

/** Renders the site's announcement, header or footer everywhere except focused task pages. */
export function SiteChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  return focused.some((p) => path === p || path.startsWith(`${p}/`)) ? null : children;
}
