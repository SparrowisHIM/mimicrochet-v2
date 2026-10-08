"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useSyncExternalStore } from "react";
import { Magnetic } from "@/components/motion/magnetic";
import { RevealText } from "@/components/motion/reveal";
import { ButtonLink, linkClass } from "@/components/ui/button";

const ease = [0.22, 1, 0.36, 1] as const;
const wide = "(min-width: 1024px)";
const subscribeWide = (notify: () => void) => {
  const m = window.matchMedia(wide);
  m.addEventListener("change", notify);
  return () => m.removeEventListener("change", notify);
};

export function Hero() {
  const reduce = useReducedMotion();
  // The photo and text ease away as you scroll, on large screens where they sit side by side.
  const desktop = useSyncExternalStore(subscribeWide, () => window.matchMedia(wide).matches, () => false);
  const scrollOut = desktop && !reduce;
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const inner = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const textFade = useTransform(scrollYProgress, [0, 0.8], [1, 0.15]);
  const fade = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease, delay } };

  return (
    <section ref={section} className="lg:container-page flex flex-col lg:flex-row lg:items-center lg:gap-[72px] lg:pt-8 lg:pb-24">
      <motion.div
        className="relative aspect-[3/4] w-full overflow-hidden max-lg:max-h-[78svh] lg:order-2 lg:w-[min(640px,calc((100dvh-150px)*0.75))] lg:shrink-0 lg:rounded-[28px]"
        style={scrollOut ? { scale: photoScale, y: photoY } : undefined}
        initial={reduce ? false : { clipPath: "inset(10% 10% 10% 10% round 28px)", opacity: 0.3 }}
        animate={{ clipPath: "inset(0% 0% 0% 0% round 0px)", opacity: 1 }}
        transition={{ duration: 1, ease }}
      >
        <motion.div className="absolute inset-0" style={scrollOut ? { scale: inner } : undefined}>
        <motion.div
          className="absolute inset-0"
          initial={reduce ? false : { scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease }}
        >
          <Image
            src="/images/story/hero-ruby.jpg"
            alt="The Ruby Dress, a red crochet top and fringed wrap skirt, laid flat with balls of red yarn and a wooden hook"
            fill
            preload
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-cover"
          />
        </motion.div>
        </motion.div>
        <motion.a
          href="/shop/red-fringe-beach-set"
          {...fade(1.0)}
          className="absolute bottom-4 left-4 flex items-center gap-2.5 rounded-full bg-white/92 px-4 py-2.5 text-[14px] shadow-sm backdrop-blur-sm transition-colors hover:bg-white lg:bottom-5 lg:left-5"
        >
          <span className="font-semibold">Ruby Dress</span>
          <span className="text-stone-600">₦40,000</span>
        </motion.a>
      </motion.div>

      <motion.div style={scrollOut ? { y: textY, opacity: textFade } : undefined} className="flex flex-col gap-6 px-5 pt-8 pb-14 lg:order-1 lg:flex-1 lg:px-0 lg:py-0">
        <RevealText
          as="h1"
          immediate
          delay={0.3}
          text={"Crochet pieces\nworth being\nseen in."}
          className="font-serif text-[40px] leading-[1.06] tracking-[-0.02em] sm:text-[56px] lg:text-[76px] lg:leading-[1.04]"
        />
        <motion.p {...fade(0.6)} className="max-w-[600px] text-[17px] leading-[1.55] text-stone-600 lg:text-[20px] lg:leading-[1.5]">
          Every stitch is by Mimi’s hands in Port Harcourt. Grab a one-of-one piece today, or dream one up and she’ll make it yours.
        </motion.p>
        <motion.div {...fade(0.72)} className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-7">
          <Magnetic strength={0.15}>
            <ButtonLink href="/shop" className="max-sm:w-full">Shop the collection</ButtonLink>
          </Magnetic>
          <Link href="/custom-order" className={linkClass}>
            Start a custom order
          </Link>
        </motion.div>
        <motion.div {...fade(0.84)} className="flex gap-7 pt-3 text-[14px] font-medium text-stone-600 max-sm:hidden">
          <span>Handmade in Port Harcourt</span>
          <span>Delivery anywhere in Nigeria</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
