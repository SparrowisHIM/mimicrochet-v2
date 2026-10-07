import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "light" | "outlineLight";
type Size = "md" | "sm";

// The main button (Figma "Buttons · options", C): an ink gradient pill with a gloss line along the top
// edge, like the glossy toggle. Hover never changes colour: a brighter layer of the same ink fades in
// over it (a ::before behind the label) and the chevron becomes an arrow.
const ink =
  "relative isolate overflow-hidden bg-linear-to-b from-stone-700 to-stone-950 text-orange-50 shadow-[inset_0_1.5px_0_rgb(255_255_255/0.22),0_12px_24px_-12px_rgb(28_25_23/0.45)] before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-linear-to-b before:from-stone-600 before:to-stone-900 before:opacity-0 before:transition-opacity before:duration-200 before:ease-out hover:shadow-[inset_0_1.5px_0_rgb(255_255_255/0.3),0_16px_30px_-12px_rgb(28_25_23/0.55)] hover:before:opacity-100 focus-visible:before:opacity-100";

// Secondary hovers sweep a fill up from the bottom (a ::before layer behind the label).
const sweep =
  "relative isolate overflow-hidden before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:rounded-[inherit] before:transition-transform before:duration-200 before:ease-[cubic-bezier(0.19,1,0.22,1)] hover:before:scale-y-100 motion-reduce:before:scale-y-100 motion-reduce:before:opacity-0 motion-reduce:before:transition-opacity motion-reduce:hover:before:opacity-100";

const variants: Record<Variant, string> = {
  primary: ink,
  secondary: `border-[1.5px] border-stone-900 text-stone-900 hover:text-orange-50 before:bg-stone-900 ${sweep}`,
  light: "bg-white text-stone-900 border-[1.5px] border-white hover:bg-orange-100 hover:border-orange-100",
  outlineLight: "border-[1.5px] border-orange-50 text-orange-50 hover:bg-orange-50 hover:text-stone-900",
};

const sizes: Record<Size, string> = {
  md: "h-[54px] px-7 text-[16px]",
  sm: "h-10 px-4 text-[14px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `group/btn inline-flex items-center justify-center gap-2 rounded-full font-semibold leading-none whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${extra}`;
}

/** The main button's chevron, which slides out as an arrow slides in on hover or keyboard focus. */
export function ArrowSwap() {
  const icon = "col-start-1 row-start-1 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";
  return (
    <span className="-mr-1 grid size-5 shrink-0 overflow-hidden" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" className={`${icon} group-hover/btn:translate-x-2 group-hover/btn:opacity-0 group-focus-visible/btn:translate-x-2 group-focus-visible/btn:opacity-0`}>
        <path d="M8.25 4.583 14.667 11l-6.417 6.417" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={`${icon} -translate-x-2 opacity-0 group-hover/btn:translate-x-0 group-hover/btn:opacity-100 group-focus-visible/btn:translate-x-0 group-focus-visible/btn:opacity-100`}>
        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** arrow: the chevron-to-arrow. On by default for full-size main buttons; off when the label has its own icon. */
type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode; arrow?: boolean };
const hasArrow = (variant: Variant = "primary", size: Size = "md", arrow?: boolean) => arrow ?? (variant === "primary" && size === "md");

export function ButtonLink({ variant, size, className = "", arrow, children, ...props }: Common & ComponentProps<typeof Link>) {
  return (
    <Link {...props} className={buttonClass(variant, size, className)}>
      {children}
      {hasArrow(variant, size, arrow) && <ArrowSwap />}
    </Link>
  );
}

export function Button({ variant, size, className = "", arrow, children, ...props }: Common & ComponentProps<"button">) {
  return (
    <button type="button" {...props} className={buttonClass(variant, size, className)}>
      {children}
      {hasArrow(variant, size, arrow) && <ArrowSwap />}
    </button>
  );
}

export function ExternalButton({ variant, size, className = "", arrow, children, ...props }: Common & ComponentProps<"a">) {
  return (
    <a target="_blank" rel="noreferrer" {...props} className={buttonClass(variant, size, className)}>
      {children}
      {hasArrow(variant, size, arrow) && <ArrowSwap />}
    </a>
  );
}
