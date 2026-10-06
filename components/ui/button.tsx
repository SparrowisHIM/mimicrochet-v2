import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "light" | "outlineLight";
type Size = "md" | "sm";

// Primary and secondary hovers sweep a fill up from the bottom (a ::before layer behind the label).
const sweep =
  "relative isolate overflow-hidden before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:rounded-[inherit] before:transition-transform before:duration-500 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:scale-y-100";

const variants: Record<Variant, string> = {
  primary: `bg-stone-900 text-orange-50 border-[1.5px] border-stone-900 hover:border-amber-800 before:bg-amber-800 ${sweep}`,
  secondary: `border-[1.5px] border-stone-900 text-stone-900 hover:text-orange-50 before:bg-stone-900 ${sweep}`,
  light: "bg-white text-stone-900 border-[1.5px] border-white hover:bg-orange-100 hover:border-orange-100",
  outlineLight: "border-[1.5px] border-orange-50 text-orange-50 hover:bg-orange-50 hover:text-stone-900",
};

const sizes: Record<Size, string> = {
  md: "h-[54px] px-7 text-[16px]",
  sm: "h-10 px-4 text-[14px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold leading-none whitespace-nowrap transition-[background-color,color,border-color,transform] duration-300 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${extra}`;
}

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function ButtonLink({ variant, size, className = "", ...props }: Common & ComponentProps<typeof Link>) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}

export function Button({ variant, size, className = "", ...props }: Common & ComponentProps<"button">) {
  return <button type="button" {...props} className={buttonClass(variant, size, className)} />;
}

export function ExternalButton({ variant, size, className = "", ...props }: Common & ComponentProps<"a">) {
  return <a target="_blank" rel="noreferrer" {...props} className={buttonClass(variant, size, className)} />;
}
