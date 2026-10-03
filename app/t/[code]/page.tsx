import type { Metadata } from "next";
import { TrackingView } from "@/components/order/tracking-view";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false },
};

export default async function TrackingPage({ params }: PageProps<"/t/[code]">) {
  const { code } = await params;
  return <TrackingView code={code} />;
}
