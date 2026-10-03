import type { Metadata, Viewport } from "next";
import { Figtree, Young_Serif } from "next/font/google";
import { Announcement } from "@/components/site/announcement";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { site } from "@/lib/site";
import "./globals.css";

const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  weight: "400",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} · Handmade crochet from Port Harcourt`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
};

export const viewport: Viewport = {
  themeColor: "#fff7ed",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${youngSerif.variable} ${figtree.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-stone-900 px-4 py-2 text-orange-50 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <Announcement />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
