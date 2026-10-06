"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { Magnetic } from "@/components/motion/magnetic";
import { Reveal, RevealText } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";

// Mimi's own video of her hands crocheting the Ruby Dress. It only plays while it's on
// screen, drifts inside its frame as you scroll, and shows the still for reduced motion.
export function MeetMimi() {
  const reduce = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const onScreen = useInView(frame, { margin: "10% 0px" });
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-9%", "9%"]);
  const frameScale = useTransform(scrollYProgress, [0, 0.45], [0.86, 1]);
  const radius = useTransform(scrollYProgress, [0, 0.45], [48, 28]);

  useEffect(() => {
    const v = video.current;
    if (!v || reduce) return;
    if (onScreen) v.play().catch(() => {});
    else v.pause();
  }, [onScreen, reduce]);

  return (
    <section className="overflow-clip bg-white">
      <div className="container-page flex flex-col gap-8 py-16 lg:flex-row lg:items-center lg:gap-20 lg:py-28">
        <motion.div
          ref={frame}
          className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px] bg-stone-200 lg:w-[560px] lg:shrink-0"
          style={reduce ? undefined : { scale: frameScale, borderRadius: radius }}
        >
          <motion.div className="absolute inset-x-0 -inset-y-[10%]" style={reduce ? undefined : { y }}>
            <video
              ref={video}
              className="size-full object-cover"
              src="/video/hands-crocheting-red.mp4"
              poster="/video/hands-crocheting-red-poster.jpg"
              muted
              loop
              playsInline
              preload="none"
              aria-label="Mimi’s hands crocheting the red Ruby Dress with an orange hook"
            />
          </motion.div>
          <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 text-[13px] font-medium backdrop-blur-sm lg:bottom-5 lg:left-5">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-red-500/70 motion-reduce:animate-none" />
              <span className="relative size-2 rounded-full bg-red-600" />
            </span>
            The Ruby Dress, in progress
          </span>
        </motion.div>
        <div className="flex max-w-[672px] flex-col gap-5">
          <RevealText text="Meet the hands behind every stitch" className="font-serif text-[32px] leading-[1.08] tracking-[-0.02em] lg:text-[56px]" />
          <Reveal delay={0.2}>
            <p className="text-[17px] leading-[1.55] text-stone-600 lg:text-[20px]">
              Mimi crochets every piece herself in her Port Harcourt studio, in colours made to turn heads. Some are ready to wear today; the
              rest she makes just for you.
            </p>
          </Reveal>
          <Reveal delay={0.3} className="pt-1">
            <Magnetic className="max-sm:w-full">
              <ButtonLink href="/about" variant="secondary" className="max-sm:w-full">
                Read her story
              </ButtonLink>
            </Magnetic>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
