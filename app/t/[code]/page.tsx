import type { Metadata } from "next";
import { TrackingView } from "@/components/order/tracking-view";
import { orderForTracking } from "@/lib/server/orders";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false },
};

export default async function TrackingPage({ params, searchParams }: PageProps<"/t/[code]">) {
  const { code } = await params;
  // Checkout lands here with ?paid=1 so the page opens on the paid moment once.
  const { paid } = await searchParams;
  // The server's copy opens on any phone. If the database can't be reached, the page falls back to
  // the copy on this phone rather than failing.
  const saved = await orderForTracking(code).catch((e) => {
    console.error("orderForTracking", e);
    return null;
  });
  return <TrackingView code={code} saved={saved} justPaid={paid === "1"} />;
}
