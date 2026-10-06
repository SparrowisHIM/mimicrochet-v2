import { ButtonLink } from "@/components/ui/button";
import { RevealText } from "@/components/motion/reveal";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[64vh] flex-col items-start justify-center gap-5 py-16 lg:items-center lg:text-center">
      <RevealText as="h1" immediate text="Dropped a stitch." className="font-serif text-[44px] leading-none tracking-[-0.02em] lg:text-[72px]" />
      <p className="max-w-[460px] text-[17px] text-stone-600">That page isn’t here. The piece may have sold, or the link has a typo.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/shop">Browse the shop</ButtonLink>
        <ButtonLink href="/custom-order" variant="secondary">
          Have something made
        </ButtonLink>
      </div>
    </div>
  );
}
