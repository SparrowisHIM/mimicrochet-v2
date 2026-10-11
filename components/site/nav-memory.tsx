"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { rememberPage } from "@/lib/history";

/** Keeps the tab's trail of pages, so "Exit" and "Back" can return to where the customer came from. */
export function NavMemory() {
  const pathname = usePathname();
  useEffect(() => rememberPage(pathname), [pathname]);
  return null;
}
