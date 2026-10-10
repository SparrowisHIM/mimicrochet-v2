import type { Metadata } from "next";
import { TrackForm } from "@/components/order/track-form";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Follow your custom order from the first stitch to your door.",
};

export default function TrackPage() {
  return (
    <div className="container-page flex min-h-[64vh] flex-col justify-center py-16 lg:items-center lg:py-24 lg:text-center">
      <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.01em] lg:text-[64px]">Track an order</h1>
      <p className="mt-3 max-w-[520px] text-[17px] text-stone-600 lg:text-[18px]">Type your order number and the last 4 digits of the phone number on your order.</p>
      <TrackForm />
    </div>
  );
}
