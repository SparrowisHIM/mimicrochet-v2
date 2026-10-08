import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { InViewVideo, Parallax, ThreadRail, VelocityMarquee, Wipe, WordReveal } from "@/components/about/about-motion";
import { FactCard } from "@/components/about/fact-card";
import { WhatsAppIcon } from "@/components/icons";
import { ButtonLink, linkClass, linkLightClass } from "@/components/ui/button";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Mimi crochets every piece herself in Port Harcourt, from playful sets to dresses that stop people mid-sentence.",
};

// One dress followed from idea to finished: the Neon Granny Square Dress. 03 and 04 are Mimi's own
// videos (upscaled); 01 is a generated reference picture and 02 a generated picture of its yarn.
type Step = { n: string; title: string; text: string; src: string; alt: string; tag?: string; video?: string; href?: string };
const steps: Step[] = [
  { n: "01", title: "Your idea", text: "A saved pin, a photo, or a piece she’s made before. This one began as a neon granny-square dress.", src: "/images/story/neon-dress-reference.jpg", alt: "A reference picture of a neon granny-square dress on a dress form", tag: "Your reference" },
  { n: "02", title: "Yarn & colour", text: "Black to hold it all together, neon to make it glow.", src: "/images/story/neon-dress-yarn.jpg", alt: "Balls of lime, orange, red, purple, pink, yellow and black yarn beside a blue crochet hook" },
  { n: "03", title: "Stitch by stitch", text: "Every square crocheted by hand, then joined to the next, one by one.", src: "/images/story/neon-squares-joining.jpg", video: "/video/neon-squares-joining.mp4", alt: "Mimi joining neon granny squares with a blue hook" },
  { n: "04", title: "Finished for you", text: "Shaped on the mannequin, every end woven in, ready to wear.", src: "/images/story/neon-dress-finished.jpg", video: "/video/neon-dress-finished.mp4", alt: "The finished Neon Granny Square Dress turning on Mimi’s mannequin", href: "/shop/neon-granny-square-dress" },
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
            className="font-serif text-[40px] leading-[1.06] tracking-[-0.02em] text-balance lg:text-[64px]"
          />
          <p className="max-w-[560px] text-[17px] leading-[1.55] text-stone-600 lg:text-[19px]">
            Mimi crochets every piece herself, from playful sets to dresses that stop people mid-sentence. Some are ready to wear today. The rest she makes just for you.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-7">
            <ButtonLink href="/shop">Shop her pieces</ButtonLink>
            <Link href="/custom-order" className={linkClass}>
              Start a custom order
            </Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[420px] lg:mx-0 lg:w-[484px] lg:max-w-none">
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[28px] bg-orange-200" aria-hidden />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-amber-900">
            <Parallax>
              <Image src="/images/story/mimi-portrait.jpg" alt="Mimi, the maker behind Mimi Crochet" fill preload sizes="(min-width: 1024px) 484px, 90vw" className="object-cover object-top" />
            </Parallax>
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
            <p className="text-[16px] text-stone-600 lg:text-[17px]">One dress, start to finish. No machines, just Mimi, a hook and a lot of yarn.</p>
          </Wipe>
          <ol className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:px-0">
            {steps.map((s) => (
              <li key={s.n} className="w-[72vw] max-w-[300px] shrink-0 snap-start lg:w-auto lg:max-w-none">
                <Wipe className="flex flex-col gap-3.5">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-orange-100">
                    {s.video ? (
                      <InViewVideo src={s.video} poster={s.src} label={s.alt} />
                    ) : (
                      <Image src={s.src} alt={s.alt} fill sizes="(min-width: 1024px) 310px, 72vw" className="object-cover" />
                    )}
                    {s.tag && <span className="absolute top-3 left-3 rounded-full bg-white/94 px-2.5 py-1 text-[12px] font-semibold">{s.tag}</span>}
                  </div>
                  <span className="font-serif text-[20px] text-amber-700">{s.n}</span>
                  <h3 className="-mt-1.5 text-[19px] font-medium">{s.title}</h3>
                  <p className="text-[15px] leading-[1.5] text-stone-600">{s.text}</p>
                  {s.href && (
                    <Link href={s.href} className={`${linkClass} self-start`}>
                      See this dress
                    </Link>
                  )}
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-7">
            <ButtonLink href="/shop" variant="light">
              Shop the one-of-ones
            </ButtonLink>
            <a href={whatsappLink("Hi Mimi! I’d love to talk about a piece.")} target="_blank" rel="noreferrer" className={linkLightClass}>
              <WhatsAppIcon size={18} /> Chat with Mimi
            </a>
          </div>
        </Wipe>
      </section>
    </>
  );
}
