"use client";

import { AnimatePresence, motion } from "motion/react";
import { HeartIcon } from "@/components/icons";
import { savedStore } from "@/lib/local-store";

export function SaveButton({ slug, name, size = "md", className = "" }: { slug: string; name: string; size?: "md" | "lg"; className?: string }) {
  const saved = savedStore.useList().includes(slug);
  const box = size === "lg" ? "size-11" : "size-9";

  return (
    <motion.button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
      onClick={() => savedStore.toggle(slug)}
      whileTap={{ scale: 0.86 }}
      className={`relative grid ${box} place-items-center rounded-full bg-white/94 shadow-[0_2px_8px_rgb(28_25_23/0.12)] backdrop-blur-sm transition-colors hover:bg-white ${className}`}
    >
      <motion.span
        key={saved ? "on" : "off"}
        initial={{ scale: saved ? 0.5 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 14 }}
        className={saved ? "text-red-600" : "text-stone-900"}
      >
        <HeartIcon size={size === "lg" ? 22 : 19} filled={saved} />
      </motion.span>
      <AnimatePresence>
        {saved && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0.55 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-red-500"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
