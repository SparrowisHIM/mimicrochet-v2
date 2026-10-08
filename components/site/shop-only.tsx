"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Shop chrome (the announcement bar, the footer) that Mimi's studio pages leave out. */
export function ShopOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return pathname.startsWith("/studio") ? null : children;
}
