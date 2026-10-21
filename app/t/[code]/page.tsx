import type { Metadata } from "next";
import { TrackingView } from "@/components/order/tracking-view";
import { orderForTracking } from "@/lib/server/orders";
import { settlePayment, type Settled } from "@/lib/server/payments";
import { tooMany } from "@/lib/server/rate-limit";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false },
};

/** Each check asks Paystack, so reloading this address over and over gets the same limit as the page's own checks. */
async function checkReturn(reference: string): Promise<Settled> {
  if (await tooMany("check", { perVisitor: [40, 10], overall: [600, 10] })) return "pending";
  return settlePayment(reference);
}

export default async function TrackingPage({ params, searchParams }: PageProps<"/t/[code]">) {
  const { code } = await params;
  // Paystack sends the customer back here with ?reference=…: check the payment with Paystack first (the
  // webhook may already have), so the page they land on already shows it paid.
  const { paid, reference } = await searchParams;
  let settled: Settled | null = null;
  if (typeof reference === "string")
    settled = await checkReturn(reference).catch((e) => {
      console.error("settlePayment", e);
      return "pending" as const;
    });
  // The server's copy opens on any phone. If the database can't be reached, the page falls back to
  // the copy on this phone rather than failing.
  const { saved, unreachable } = await orderForTracking(code)
    .then((saved) => ({ saved, unreachable: false }))
    .catch((e) => {
      console.error("orderForTracking", e);
      return { saved: null, unreachable: true };
    });
  return <TrackingView code={code} saved={saved} justPaid={paid === "1" || settled === "paid"} payment={settled} unreachable={unreachable} />;
}
