"use client";

import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons";
import { lockScroll } from "@/lib/scroll-lock";

/**
 * Bottom sheet on phones, side panel on desktop (or a centred bottom sheet with side="bottom").
 * Springs in with a soft overshoot, dims the page, closes on Esc, on the dim, or by dragging the handle down.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  aside,
  side = "right",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Small text beside the title, e.g. a step count. */
  aside?: ReactNode;
  side?: "right" | "bottom";
}) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const drag = useDragControls();

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const unlock = lockScroll();
    const visiblePanel = () => [...(root.current?.querySelectorAll<HTMLElement>("[data-panel]") ?? [])].find((p) => p.offsetParent !== null);
    const focusables = () =>
      [...(visiblePanel()?.querySelectorAll<HTMLElement>("button, a[href], input, textarea, select") ?? [])].filter((el) => !el.hasAttribute("disabled"));
    const t = setTimeout(() => focusables()[0]?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      unlock();
      opener?.focus?.();
    };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  const spring = reduce ? { duration: 0.2 } : { type: "spring" as const, stiffness: 260, damping: 28 };
  const right = side === "right";

  const header = (handle: boolean) => (
    <>
      {handle && (
        <div className="flex cursor-grab touch-none justify-center pt-3 pb-1 active:cursor-grabbing" onPointerDown={(e) => drag.start(e)} aria-hidden>
          <span className="h-[5px] w-10 rounded-full bg-stone-300" />
        </div>
      )}
      <div
        className={`flex items-center justify-between px-5 pt-3 pb-4 lg:px-7 ${handle ? "touch-none" : "lg:pt-7"}`}
        onPointerDown={handle ? (e) => { if (!(e.target as HTMLElement).closest("button")) drag.start(e); } : undefined}
      >
        <h2 className="font-serif text-[24px] leading-tight lg:text-[28px]">{title}</h2>
        {aside && <span className="mr-2 ml-auto text-[14px] font-medium text-stone-500 tabular-nums">{aside}</span>}
        <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-orange-100" aria-label="Close">
          <CloseIcon size={20} />
        </button>
      </div>
    </>
  );

  const body = (
    <>
      <div data-sheet-body className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 lg:px-7">{children}</div>
      {footer && <div className="border-t border-stone-200/70 px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] lg:px-7 lg:pb-7">{footer}</div>}
    </>
  );

  return (
    <AnimatePresence>
      {open && (
        <div ref={root} className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-stone-900/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          <motion.div
            data-panel
            className={`absolute inset-x-0 bottom-0 flex max-h-[94dvh] flex-col rounded-t-[28px] bg-orange-50 ${
              right ? "lg:hidden" : "mx-auto lg:max-w-[560px]"
            }`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring}
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            {header(true)}
            {body}
          </motion.div>

          {right && (
            <motion.div
              data-panel
              className="absolute inset-y-0 right-0 hidden w-[460px] flex-col bg-orange-50 shadow-[-24px_0_60px_rgb(28_25_23/0.18)] lg:flex"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={spring}
            >
              {header(false)}
              {body}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
