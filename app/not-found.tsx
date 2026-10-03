import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[64vh] flex-col items-start justify-center gap-5 py-16 lg:items-center lg:text-center">
      <h1 className="font-serif text-[44px] leading-none tracking-[-0.02em] lg:text-[72px]">Dropped a stitch.</h1>
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
