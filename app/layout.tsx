import type { Metadata, Viewport } from "next";
import { Figtree, Young_Serif } from "next/font/google";
import { BagDrawer } from "@/components/cart/bag-drawer";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3020");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  openGraph: { images: ["/images/story/hero-ruby.jpg"], siteName: site.name },
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
        {/* overflow-x-clip: stamps, tags and flashes that peek past a card must never widen the page
            on a phone (that lets it pan sideways and lose the header). It sits on main, not body,
            because phones pass body overflow up to the viewport and still pan; clip keeps sticky working. */}
        <main id="main" className="flex-1 overflow-x-clip">
          {children}
        </main>
        <Footer />
        <BagDrawer />
      </body>
    </html>
  );
}
