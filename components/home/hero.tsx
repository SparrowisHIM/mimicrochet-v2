"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ButtonLink } from "@/components/ui/button";

const ease = [0.22, 1, 0.36, 1] as const;
const lines = ["Crochet pieces", "worth being", "seen in."];

export function Hero() {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : { initial: { y: "105%" }, animate: { y: "0%" }, transition: { duration: 0.9, ease, delay } };
  const fade = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease, delay } };

  return (
    <section className="lg:container-page flex flex-col lg:flex-row lg:items-center lg:gap-[72px] lg:pt-8 lg:pb-24">
      <motion.div
        className="relative aspect-[3/4] w-full overflow-hidden max-lg:max-h-[78svh] lg:order-2 lg:w-[min(640px,calc((100dvh-150px)*0.75))] lg:shrink-0 lg:rounded-[28px]"
        initial={reduce ? false : { clipPath: "inset(6% 6% 6% 6% round 28px)", opacity: 0.4 }}
        animate={{ clipPath: "inset(0% 0% 0% 0% round 0px)", opacity: 1 }}
        transition={{ duration: 1.2, ease }}
      >
        <motion.div
          className="absolute inset-0"
          initial={reduce ? false : { scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease }}
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
        <motion.a
          href="/shop/red-fringe-beach-set"
          {...fade(1.0)}
          className="absolute bottom-4 left-4 flex items-center gap-2.5 rounded-full bg-white/92 px-4 py-2.5 text-[14px] shadow-sm backdrop-blur-sm transition-colors hover:bg-white lg:bottom-5 lg:left-5"
        >
          <span className="font-semibold">Ruby Dress</span>
          <span className="text-stone-600">₦40,000</span>
        </motion.a>
      </motion.div>

      <div className="flex flex-col gap-6 px-5 pt-8 pb-14 lg:order-1 lg:flex-1 lg:px-0 lg:py-0">
        <h1 className="font-serif text-[40px] leading-[1.06] tracking-[-0.02em] text-balance sm:text-[56px] lg:text-[76px] lg:leading-[1.04]">
          {lines.map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.06em] max-lg:inline max-lg:overflow-visible">
              <motion.span className="block max-lg:inline" {...rise(0.25 + i * 0.1)}>
                {line}
              </motion.span>{" "}
            </span>
          ))}
        </h1>
        <motion.p {...fade(0.6)} className="max-w-[600px] text-[17px] leading-[1.55] text-stone-600 lg:text-[20px] lg:leading-[1.5]">
          Every stitch is by Mimi’s hands in Port Harcourt. Grab a one-of-one piece today, or dream one up and she’ll make it yours.
        </motion.p>
        <motion.div {...fade(0.72)} className="flex flex-col gap-3 pt-2 sm:flex-row">
          <ButtonLink href="/shop">Shop the collection</ButtonLink>
          <ButtonLink href="/custom-order" variant="secondary">
            Start a custom order
          </ButtonLink>
        </motion.div>
        <motion.div {...fade(0.84)} className="flex gap-7 pt-3 text-[14px] font-medium text-stone-600 max-sm:hidden">
          <span>Handmade in Port Harcourt</span>
          <span>Delivery anywhere in Nigeria</span>
        </motion.div>
      </div>
    </section>
  );
}
