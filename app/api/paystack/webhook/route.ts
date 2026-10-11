import { webhookIsFromPaystack } from "@/lib/server/paystack";
import { settlePayment } from "@/lib/server/payments";

// Paystack calls this the moment a payment goes through, even if the customer closes the page before
// coming back. Only signed calls count, and the payment is still checked with Paystack before it's
// applied (settlePayment), so a forged or replayed call can't mark anything paid.
// Paste this address into Paystack: Settings > API Keys & Webhooks > Webhook URL.

export async function POST(request: Request) {
  const raw = await request.text();
  if (!webhookIsFromPaystack(raw, request.headers.get("x-paystack-signature"))) return new Response("Bad signature", { status: 401 });
  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad body", { status: 400 });
  }
  if (event.event === "charge.success" && typeof event.data?.reference === "string") {
    try {
      await settlePayment(event.data.reference);
    } catch (e) {
      // Paystack retries a webhook that doesn't answer 200, so a failure here gets another go.
      console.error("paystack webhook", e);
      return new Response("Try again", { status: 500 });
    }
  }
  return new Response("OK");
}
