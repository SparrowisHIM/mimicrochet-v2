import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";

export function MeetMimi() {
  return (
    <section className="bg-white">
      <div className="container-page flex flex-col gap-8 py-16 lg:flex-row lg:items-center lg:gap-20 lg:py-24">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px] lg:w-[560px] lg:shrink-0 lg:rounded-[28px]">
          <Image
            src="/images/story/hands-crocheting-red.jpg"
            alt="Mimi’s hands crocheting red yarn with an orange hook"
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex max-w-[672px] flex-col gap-5">
          <h2 className="font-serif text-[32px] leading-[1.08] tracking-[-0.02em] lg:text-[56px]">Meet the hands behind every stitch</h2>
          <p className="text-[17px] leading-[1.55] text-stone-600 lg:text-[20px]">
            Mimi crochets every piece herself in her Port Harcourt studio, in colours made to turn heads. Some are ready to wear today; the
            rest she makes just for you.
          </p>
          <div className="pt-1">
            <ButtonLink href="/about" variant="secondary" className="max-sm:w-full">
              Read her story
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
