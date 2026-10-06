import Image from "next/image";
import type { CSSProperties } from "react";

// A fanned stack of photo cards: each card tilts out from a shared base point with a thin white
// edge, and the fan spreads wider when you hover the stack or the control that holds it
// (any ancestor with the `group` class). Motion and sizes live in globals.css (.card-fan).

const sizes = {
  sm: { w: 32, h: 42, x: 12, r: 12, xOpen: 20, rOpen: 19 },
  md: { w: 50, h: 66, x: 16, r: 10, xOpen: 26, rOpen: 16 },
};

export function CardStack({ images, size = "sm", className = "" }: { images: string[]; size?: keyof typeof sizes; className?: string }) {
  const s = sizes[size];
  const cards = images.slice(0, 3);
  const mid = (cards.length - 1) / 2;
  const style = {
    "--card-w": `${s.w}px`,
    "--card-h": `${s.h}px`,
    "--fan-x": `${s.x}px`,
    "--fan-r": `${s.r}deg`,
    "--fan-x-open": `${s.xOpen}px`,
    "--fan-r-open": `${s.rOpen}deg`,
    width: s.w + s.xOpen * 2 * mid + 10,
    height: s.h + 8,
  } as CSSProperties;

  return (
    <span className={`card-fan shrink-0 ${className}`} style={style} aria-hidden>
      {cards.map((src, i) => {
        const k = i - mid;
        return (
          <span key={src + i} style={{ "--i": k, zIndex: 10 - Math.round(Math.abs(k) * 2) } as CSSProperties}>
            {src.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" className="size-full object-cover" />
            ) : (
              <Image src={src} alt="" fill sizes={`${s.w * 2}px`} className="object-cover" />
            )}
          </span>
        );
      })}
    </span>
  );
}
