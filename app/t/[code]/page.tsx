import type { Metadata } from "next";
import { TrackingView } from "@/components/order/tracking-view";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false },
};

export default async function TrackingPage({ params, searchParams }: PageProps<"/t/[code]">) {
  const { code } = await params;
  // Checkout lands here with ?paid=1 so the page opens on the paid moment once.
  const { paid } = await searchParams;
  return <TrackingView code={code} justPaid={paid === "1"} />;
}
