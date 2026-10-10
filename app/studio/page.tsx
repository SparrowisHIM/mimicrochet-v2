import type { Metadata } from "next";
import { StudioSignIn } from "@/components/studio/sign-in";
import { StudioView } from "@/components/studio/studio-view";
import { vapidPublicKey } from "@/lib/server/push";
import { isStudio } from "@/lib/server/session";
import { deleteExpiredCustomerFiles, ordersForStudio } from "@/lib/server/studio";

export const metadata: Metadata = {
  title: "Mimi’s orders",
  robots: { index: false },
  // Added to Mimi's home screen, the studio opens on its own, straight on her orders.
  manifest: "/studio/manifest.webmanifest",
  appleWebApp: { title: "Mimi’s orders", capable: true, statusBarStyle: "default" },
};

export default async function StudioPage() {
  if (!(await isStudio())) return <StudioSignIn />;
  // Mimi opening her studio is also when the 2-month rule on customers' files is applied: it's quick
  // when there's nothing to delete, and never holds the page up if it fails.
  await deleteExpiredCustomerFiles().catch((e) => console.error("deleteExpiredCustomerFiles", e));
  const orders = await ordersForStudio();
  return <StudioView orders={orders} publicKey={vapidPublicKey()} />;
}
