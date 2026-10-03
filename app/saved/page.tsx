import type { Metadata } from "next";
import { SavedView } from "@/components/saved/saved-view";

export const metadata: Metadata = { title: "Saved", robots: { index: false } };

export default function SavedPage() {
  return <SavedView />;
}
