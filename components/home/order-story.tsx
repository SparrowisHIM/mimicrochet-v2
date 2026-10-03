"use client";

import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useRef, useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { TrackingCard } from "@/components/order/tracking-card";
import { ButtonLink, ExternalButton } from "@/components/ui/button";
import { whatsappLink } from "@/lib/site";
import { stages } from "@/lib/stages";

// One real order told start to finish: the Ruby Dress.
const story = [
  { photo: "/images/story/hero-ruby.jpg", alt: "The Ruby Dress photo a customer sent Mimi as her idea", note: "Got your photo. I love this one!" },
  { photo: "/images/story/ruby-yarn.jpg", alt: "Balls of red yarn picked for the order", note: "Price agreed and yarn picked." },
  { photo: "/images/story/ruby-in-progress.jpg", alt: "The red skirt panel half crocheted, with the yarn beside it", note: "Top done, starting the skirt." },
  { photo: "/images/products/red-fringe-beach-set-1.jpg", alt: "The finished Ruby Dress on Mimi's mannequin", note: "All done! Photos on WhatsApp." },
  { photo: "/images/story/ruby-skirt-detail.jpg", alt: "Close view of the fringed red skirt", note: "Delivered. Enjoy wearing it!" },
];

const title = "From idea to doorstep";
const intro = "You bring the idea, Mimi brings the hook. Follow every stage from your phone, from the first stitch to your doorstep.";

function Stages({ active, progress }: { active: number; progress: ReturnType<typeof useSpring> | null }) {
  return (
    <ol className="relative flex flex-col" aria-label="Order stages">
      <span className="absolute top-[21px] left-[6px] h-[168px] w-0.5 bg-stone-200" aria-hidden />
      <motion.span
        className="absolute top-[21px] left-[6px] h-[168px] w-0.5 origin-top bg-stone-900"
        style={progress ? { scaleY: progress } : { scaleY: 0.5 }}
        aria-hidden
      />
      {stages.map((s, i) => {
        const done = i < active;
        const now = i === active;
        return (
          <li key={s.key} className="relative flex items-center gap-4 py-2.5" aria-current={now ? "step" : undefined}>
            <span className="relative grid size-3.5 place-items-center">
              <motion.span
                className="block rounded-full"
                animate={{
                  width: now ? 14 : 10,
                  height: now ? 14 : 10,
                  backgroundColor: now ? "#92400e" : done ? "#1c1917" : "#d6d3d1",
                  boxShadow: now ? "0 0 0 4px #fde68a" : "0 0 0 0px #fde68a",
                }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
            <span
              className={`text-[17px] leading-[1.3] transition-colors duration-300 ${
                now ? "font-semibold text-stone-900" : done ? "font-medium text-stone-600" : "font-medium text-stone-400"
              }`}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Actions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <ButtonLink href="/custom-order">Start a custom order</ButtonLink>
      <ExternalButton href={whatsappLink("Hi Mimi! I’d like to talk about a custom piece.")} variant="secondary">
        <WhatsAppIcon size={18} /> Chat on WhatsApp
      </ExternalButton>
    </div>
  );
}

export function OrderStory() {
  const reduce = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  const [active, setActive] = useState(reduce ? 2 : 0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (reduce) return;
    const next = Math.min(stages.length - 1, Math.floor(v * stages.length * 0.999));
    setActive((cur) => (cur === next ? cur : next));
  });

  const media = (
    <div className="relative mx-auto w-full max-w-[420px] lg:mx-0 lg:w-[560px] lg:max-w-none">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-orange-100 lg:rounded-[24px]">
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image src={story[active].photo} alt={story[active].alt} fill sizes="(min-width: 1024px) 560px, 90vw" className="object-cover" />
          </motion.div>
        </AnimatePresence>
      </div>
      <TrackingCard
        orderId="MIMI-2406"
        piece="Ruby Dress"
        stage={active}
        note={story[active].note}
        className="relative z-10 mx-3 -mt-24 lg:absolute lg:-bottom-[60px] lg:-left-16 lg:mx-0 lg:mt-0 lg:w-[380px]"
      />
    </div>
  );

  return (
    <section className="bg-white" aria-label={title}>
      {/* Phone: title and intro scroll normally above the pinned photo */}
      <div className="container-page flex flex-col gap-4 pt-16 lg:hidden">
        <h2 className="font-serif text-[32px] leading-[1.08] tracking-[-0.02em]">
          {title}
        </h2>
        <p className="text-[17px] leading-[1.55] text-stone-600">{intro}</p>
      </div>

      <div ref={track} className={reduce ? "" : "relative h-[260vh] lg:h-[320vh]"}>
        <div className={reduce ? "py-10 lg:py-32" : "sticky top-0 flex h-dvh items-center"}>
          <div className="container-page flex w-full flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-28">
            <div className="hidden w-[640px] shrink-0 flex-col gap-7 lg:flex">
              <h2 className="font-serif text-[56px] leading-[1.08] tracking-[-0.02em]">
                From idea
                <br />
                to doorstep
              </h2>
              <p className="text-[20px] leading-[1.55] text-stone-600">{intro}</p>
              <Stages active={active} progress={reduce ? null : smooth} />
              <div className="pt-2">
                <Actions />
              </div>
            </div>
            {media}
            {/* Phone: compact stage dots under the card */}
            <div className="flex items-center gap-2 lg:hidden" aria-hidden>
              {stages.map((s, i) => (
                <span key={s.key} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-6 bg-stone-900" : i < active ? "w-1.5 bg-stone-900" : "w-1.5 bg-stone-300"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container-page pb-16 lg:hidden">
        <Actions />
      </div>
    </section>
  );
}
