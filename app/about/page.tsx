import type { Metadata } from "next";
import Image from "next/image";
import { Parallax, ThreadRail, VelocityMarquee, Wipe, WordReveal } from "@/components/about/about-motion";
import { FactCard } from "@/components/about/fact-card";
import { WhatsAppIcon } from "@/components/icons";
import { ButtonLink, ExternalButton } from "@/components/ui/button";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Mimi crochets every piece herself in Port Harcourt, from playful sets to dresses that stop people mid-sentence.",
};

const steps = [
  { n: "01", title: "Your idea", text: "A photo, a saved pin, or a piece she’s made before.", src: "/images/ideas/carnival-granny-crochet-shirt.jpg", alt: "A concept picture of a granny-square shirt", tag: "Your reference" },
  { n: "02", title: "Yarn & colour", text: "Picked to glow on skin, in the sun and on camera.", src: "/images/story/yarn-pink-white-red.jpg", alt: "Pink, white and red balls of yarn in Mimi’s hand" },
  { n: "03", title: "Stitch by stitch", text: "Crocheted by hand, one row at a time.", src: "/images/story/stitch-heart-square.jpg", alt: "A crochet hook working purple heart squares" },
  { n: "04", title: "Finished for you", text: "Edges, ties and straps finished so it wears beautifully.", src: "/images/products/candy-bloom-ruffle-set-1.jpg", alt: "The finished Sasha Ruffle Set on Mimi’s mannequin" },
];

export default function AboutPage() {
  return (
    <>
      <ThreadRail knots={5} />

      <section className="container-page flex flex-col gap-10 pt-8 pb-16 lg:flex-row lg:items-center lg:gap-20 lg:pt-16 lg:pb-24">
        <div className="flex flex-1 flex-col gap-6">
          <WordReveal
            before="Crochet made with colour, care and"
            marked="Port Harcourt"
            after="energy."
            className="font-serif text-[40px] leading-[1.06] tracking-[-0.02em] lg:text-[64px]"
          />
          <p className="max-w-[560px] text-[17px] leading-[1.55] text-stone-600 lg:text-[19px]">
            Mimi crochets every piece herself, from playful sets to dresses that stop people mid-sentence. Some are ready to wear today. The rest she makes just for you.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/shop">Shop her pieces</ButtonLink>
            <ButtonLink href="/custom-order" variant="secondary">
              Start a custom order
            </ButtonLink>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[420px] lg:mx-0 lg:w-[484px] lg:max-w-none">
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[28px] bg-orange-200" aria-hidden />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-amber-900">
            <Parallax>
              <Image src="/images/story/mimi-portrait.jpg" alt="Mimi, the maker behind Mimi Crochet" fill preload sizes="(min-width: 1024px) 484px, 90vw" className="object-cover object-top" />
            </Parallax>
          </div>
          <div className="absolute bottom-5 left-5 flex flex-col rounded-[14px] bg-white/95 px-4 py-2.5 shadow-sm">
            <span className="text-[12px] font-semibold text-amber-700">Mimi</span>
            <span className="text-[14px] font-medium">Maker, Port Harcourt</span>
          </div>
        </div>
      </section>

      <VelocityMarquee items={["Handmade in Port Harcourt", "Colour-led crochet", "One of one", "Made to your size", "Delivered anywhere in Nigeria"]} />

      <section className="container-page flex flex-col gap-8 py-16 lg:flex-row lg:justify-between lg:gap-16 lg:py-28">
        <Wipe>
          <h2 className="font-serif text-[34px] leading-[1.08] tracking-[-0.02em] lg:text-[52px]">
            A small studio
            <br />
            for loud colour.
          </h2>
        </Wipe>
        <Wipe className="flex max-w-[520px] flex-col gap-5 text-[17px] leading-[1.6] text-stone-600 lg:text-[19px]">
          <p>Mimi Crochet started with the joy of turning yarn into outfits people remember: beach sets, bright mini dresses, soft tops and shirts that start conversations.</p>
          <p>It grew into a studio built on care, detail and colour. Shop what’s ready, ask for a piece she’s made before, or bring your own idea and let Mimi shape it around you.</p>
          <blockquote className="border-l-2 border-amber-600 pl-5">
            <p className="font-serif text-[24px] leading-[1.3] text-stone-900 lg:text-[28px]">“If Mimi wouldn’t wear it out, it doesn’t leave the studio.”</p>
            <footer className="mt-2 text-[13px] text-stone-500">The studio standard</footer>
          </blockquote>
        </Wipe>
      </section>

      <section className="bg-white py-16 lg:py-28">
        <div className="container-page flex flex-col gap-8 lg:gap-12">
          <Wipe className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-serif text-[34px] leading-[1.08] tracking-[-0.02em] lg:text-[48px]">How a piece comes to life</h2>
            <p className="text-[16px] text-stone-600 lg:text-[17px]">No machines. Just Mimi, a hook and a lot of yarn.</p>
          </Wipe>
          <ol className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:px-0">
            {steps.map((s) => (
              <li key={s.n} className="w-[72vw] max-w-[300px] shrink-0 snap-start lg:w-auto lg:max-w-none">
                <Wipe className="flex flex-col gap-3.5">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-orange-100">
                    <Image src={s.src} alt={s.alt} fill sizes="(min-width: 1024px) 310px, 72vw" className="object-cover" />
                    {s.tag && <span className="absolute top-3 left-3 rounded-full bg-white/94 px-2.5 py-1 text-[12px] font-semibold">{s.tag}</span>}
                  </div>
                  <span className="font-serif text-[20px] text-amber-700">{s.n}</span>
                  <h3 className="-mt-1.5 text-[19px] font-medium">{s.title}</h3>
                  <p className="text-[15px] leading-[1.5] text-stone-600">{s.text}</p>
                </Wipe>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page grid gap-4 py-16 lg:grid-cols-3 lg:gap-6 lg:py-24">
        <FactCard title="One of one" text="Every ready-to-wear piece exists once. When it’s gone, it’s gone." />
        <FactCard title="Made to your size" text="Pick XS to XL, or send your own measurements." />
        <FactCard title="Anywhere in Nigeria" text="Delivered to your door, in every state." />
      </section>

      <section className="container-page pb-16 lg:pb-24">
        <Wipe className="flex flex-col gap-6 rounded-[28px] bg-stone-900 px-6 py-10 text-orange-50 lg:flex-row lg:items-center lg:justify-between lg:px-14 lg:py-14">
          <div className="flex flex-col gap-3">
            <h2 className="font-serif text-[32px] leading-[1.08] lg:text-[44px]">
              Your next favourite outfit
              <br className="max-lg:hidden" /> is one message away.
            </h2>
            <p className="text-[16px] text-stone-300 lg:text-[18px]">Shop what’s ready, or tell Mimi what you’re dreaming of.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/shop" variant="light">
              Shop the one-of-ones
            </ButtonLink>
            <ExternalButton href={whatsappLink("Hi Mimi! I’d love to talk about a piece.")} variant="outlineLight">
              <WhatsAppIcon size={18} /> Chat with Mimi
            </ExternalButton>
          </div>
        </Wipe>
      </section>
    </>
  );
}
