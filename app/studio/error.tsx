"use client";

import { Button } from "@/components/ui/button";

// When Mimi's studio can't load (usually her connection dropped, or the database didn't answer).
export default function StudioError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page flex justify-center pt-[72px] pb-24 lg:pt-[120px]">
      <div className="flex w-full max-w-[420px] flex-col gap-4">
        <h1 className="font-serif text-[34px] leading-[1.05] tracking-[-0.01em] lg:text-center lg:text-[48px]">Your orders didn’t load</h1>
        <p className="text-[17px] leading-[1.5] text-stone-600 lg:text-center lg:text-[15px]">Check you’re online, then try again. Nothing you saved is lost.</p>
        <Button className="mt-2 w-full" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
