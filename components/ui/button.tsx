import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "light" | "outlineLight";
type Size = "md" | "sm";

const variants: Record<Variant, string> = {
  primary: "bg-stone-900 text-orange-50 hover:bg-stone-800 border-[1.5px] border-stone-900",
  secondary: "border-[1.5px] border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-orange-50",
  light: "bg-white text-stone-900 border-[1.5px] border-white hover:bg-orange-100 hover:border-orange-100",
  outlineLight: "border-[1.5px] border-orange-50 text-orange-50 hover:bg-orange-50 hover:text-stone-900",
};

const sizes: Record<Size, string> = {
  md: "h-[54px] px-7 text-[16px]",
  sm: "h-10 px-4 text-[14px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold leading-none whitespace-nowrap transition-[background-color,color,border-color,transform] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${extra}`;
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
