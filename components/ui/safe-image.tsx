"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PhotoOffIcon } from "@/components/icons";

/** Customer and progress photos come from the order's file store, and a file can go missing: customer photos are
 *  deleted two months after delivery, and an upload can fail. Instead of the browser's broken-image icon the frame
 *  shows a quiet crossed-out photo (and, on big frames, says so). Fills its parent, like next/image `fill`. */
export function SafeImage({
  src,
  alt,
  sizes = "100px",
  preload = false,
  note = false,
  className = "",
}: {
  src: string;
  alt: string;
  sizes?: string;
  preload?: boolean;
  /** Write "No longer available" under the icon (for large frames). */
  note?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState<string | null>(null);
  // A file that fails before the page is interactive never reaches onError, so look once it's mounted.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(src);
  }, [src]);

  if (failed === src)
    return (
      <span role="img" aria-label={`${alt || "Photo"}: no longer available`} className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-100 text-stone-400">
        <PhotoOffIcon size={note ? 28 : 18} />
        {note && <span className="text-[14px] font-medium text-stone-500">No longer available</span>}
      </span>
    );
  return (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      unoptimized={/^(\/api\/|data:|blob:)/.test(src)}
      onError={() => setFailed(src)}
      className={`object-cover ${className}`}
    />
  );
}
