import Link from "next/link";
import { ChevronIcon } from "@/components/icons";

// A secondary control on a hairline: the label sits between two thin rules with a small chevron circle
// (the "More pieces" device from the custom order). A link points right; an expander points down and
// turns over once it's open.

type Props = {
  label: string;
  className?: string;
} & ({ href: string; onClick?: never; expanded?: never; controls?: never } | { href?: never; onClick: () => void; expanded?: boolean; controls?: string });

export function Hairline({ label, className = "", ...rest }: Props) {
  const inner = "group flex items-center gap-2 rounded-full py-1 pr-1 pl-2 text-[14px] font-medium text-stone-900";
  const content = (down: boolean, open = false) => (
    <>
      <span className="underline-offset-4 group-hover:underline">{label}</span>
      <span
        className={`grid size-[26px] place-items-center rounded-full border border-stone-200 bg-white text-stone-600 transition-[border-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:border-stone-400 group-hover:text-stone-900 ${
          down ? (open ? "rotate-180" : "") : "group-hover:translate-x-0.5"
        }`}
        aria-hidden
      >
        <ChevronIcon size={13} direction={down ? "down" : "right"} />
      </span>
    </>
  );
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      <span className="h-px flex-1 bg-stone-200" aria-hidden />
      {rest.href !== undefined ? (
        <Link href={rest.href} className={inner}>
          {content(false)}
        </Link>
      ) : (
        <button type="button" onClick={rest.onClick} aria-expanded={rest.expanded} aria-controls={rest.controls} className={inner}>
          {content(true, rest.expanded)}
        </button>
      )}
      <span className="h-px flex-1 bg-stone-200" aria-hidden />
    </div>
  );
}
