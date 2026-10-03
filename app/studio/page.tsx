import type { Metadata } from "next";
import { StudioView } from "@/components/studio/studio-view";

export const metadata: Metadata = { title: "Mimi’s orders", robots: { index: false } };

export default function StudioPage() {
  return <StudioView />;
}
