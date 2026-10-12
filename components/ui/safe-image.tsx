"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PhotoOffIcon } from "@/components/icons";
import { afterFailedLoad, retryUrl } from "@/lib/file-gone";

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
  const [attempt, setAttempt] = useState(0);
  const tries = useRef(0);
  // A failed load only counts as "gone" when the server says so; otherwise it tries again (twice).
  const onFail = () => afterFailedLoad(src, tries, () => setFailed(src), setAttempt);
  // A file that fails before the page is interactive never reaches onError, so look once it's mounted.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) afterFailedLoad(src, tries, () => setFailed(src), setAttempt);
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
      src={retryUrl(src, attempt)}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      unoptimized={/^(\/api\/|data:|blob:)/.test(src)}
      onError={() => onFail()}
      className={`object-cover ${className}`}
    />
  );
}
