"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { introLifted } from "@/lib/intro";
import { BALL, LETTERS, LOGO_VIEWBOX, MARK, TAIL } from "@/lib/logo";

// The loading screen (Figma: Home > Loading). First visit only, 2.5s, no skip: Mimi's logo stitches
// itself in amber thread, fills with ink, the yarn ball rolls in, its tail draws out, MIMICROCHET
// appears letter by letter, then the cream lifts away and the page plays its own entrance (see
// lib/intro.ts). The motion is CSS (.intro in globals.css) so it starts with the first paint; this
// component only signals the lift and cleans up after.

const SEEN = "mimi:intro";
// Runs while the HTML is still parsing, before the first paint: later page loads in the same visit
// hide the intro at once (the root layout doesn't re-render on in-site navigation, so it never replays).
const script = `(function(){var e=document.getElementById("intro");if(!e)return;try{if(sessionStorage.getItem("${SEEN}")){e.hidden=true;return}sessionStorage.setItem("${SEEN}","1")}catch(x){}})()`;

const circle = (r: number) => `M${BALL.cx - r} ${BALL.cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const tail = (lift: number) => `M${TAIL.x} ${TAIL.y - lift}h${TAIL.w}v${TAIL.h + lift}h${-TAIL.w}Z`;
const page = "M340 390H690V665H340Z";

export function Intro() {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.hidden) return;
    const start = (e: AnimationEvent) => {
      if (e.animationName === "intro-lift") introLifted();
    };
    const end = (e: AnimationEvent) => {
      if (e.target === el && (e.animationName === "intro-done" || e.animationName === "intro-fade")) {
        introLifted();
        setGone(true);
      }
    };
    // No scrolling the page underneath while the logo is on screen.
    const hold = (e: Event) => e.preventDefault();
    el.addEventListener("animationstart", start);
    el.addEventListener("animationend", end);
    el.addEventListener("wheel", hold, { passive: false });
    el.addEventListener("touchmove", hold, { passive: false });
    const late = window.setTimeout(() => {
      introLifted();
      setGone(true);
    }, 4000);
    return () => {
      el.removeEventListener("animationstart", start);
      el.removeEventListener("animationend", end);
      el.removeEventListener("wheel", hold);
      el.removeEventListener("touchmove", hold);
      window.clearTimeout(late);
    };
  }, []);

  if (gone) return null;
  return (
    <>
      <div ref={ref} id="intro" className="intro" aria-hidden suppressHydrationWarning>
        <div className="intro-curtain">
          <svg viewBox={LOGO_VIEWBOX} className="intro-logo">
            <defs>
              {/* drawn once, reused by every layer below */}
              <path id="intro-mark" d={MARK} fillRule="evenodd" pathLength={1} vectorEffect="non-scaling-stroke" />
              {/* the mark, minus the ball and its tail (they arrive on their own). The ball and tail
                  overlap the rest by a hair so no seam shows where they meet, and the thread keeps
                  clear of the ball so its line doesn't leave a ring. */}
              <clipPath id="intro-mc">
                <path clipRule="evenodd" d={`${page}${circle(BALL.r)}${tail(0)}`} />
              </clipPath>
              <clipPath id="intro-thread">
                <path clipRule="evenodd" d={`${page}${circle(BALL.r + 3)}${tail(2)}`} />
              </clipPath>
              <clipPath id="intro-ball">
                <path d={circle(BALL.r + 1)} />
              </clipPath>
              <clipPath id="intro-tail">
                <rect className="intro-tail-clip" x={TAIL.x} y={TAIL.y - 1} width={TAIL.w} height={TAIL.h + 1} />
              </clipPath>
            </defs>
            <use href="#intro-mark" className="intro-thread" clipPath="url(#intro-thread)" />
            <use href="#intro-mark" className="intro-ink" fill="currentColor" clipPath="url(#intro-mc)" />
            <g className="intro-ball">
              <use href="#intro-mark" fill="currentColor" clipPath="url(#intro-ball)" />
            </g>
            <use href="#intro-mark" className="intro-tail" fill="currentColor" clipPath="url(#intro-tail)" />
            {LETTERS.map((d, i) => (
              <path key={i} className="intro-letter" d={d} fill="currentColor" style={{ "--i": i } as CSSProperties} />
            ))}
          </svg>
        </div>
      </div>
      <InlineScript html={script} />
    </>
  );
}

// From the Next.js guide "Preventing flash before hydration": runs on the server-rendered page, and
// renders as inert text on the client so React doesn't warn about a <script> tag.
function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
