import type { Metadata, Viewport } from "next";
import { Figtree, Young_Serif } from "next/font/google";
import { BagDrawer } from "@/components/cart/bag-drawer";
import { Announcement } from "@/components/site/announcement";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { ShopOnly } from "@/components/site/shop-only";
import { InputModality } from "@/components/site/input-modality";
import { Intro } from "@/components/site/intro";
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
  // Share pictures come from app/opengraph-image.tsx (every page) and app/shop/[slug]/opengraph-image.tsx (each piece).
  openGraph: { siteName: site.name },
  twitter: { card: "summary_large_image" },
  title: {
    default: `${site.name} · Handmade crochet from Port Harcourt`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  // Icons live in public/ (made from Mimi's logo by design-assets/brand/build_icons.py). Listed here rather
  // than as app/ files so the .ico can say 32x32: with sizes="any" Chrome picks it over the SVG, and only
  // the SVG turns cream in a dark browser.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
  },
  // The name under the icon when someone adds the site to an iPhone home screen.
  appleWebApp: { title: site.shortName },
};

export const viewport: Viewport = {
  themeColor: "#fff7ed",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${youngSerif.variable} ${figtree.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <Intro />
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-stone-900 px-4 py-2 text-orange-50 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <ShopOnly>
          <Announcement />
        </ShopOnly>
        <Header />
        {/* overflow-x-clip: stamps, tags and flashes that peek past a card must never widen the page
            on a phone (that lets it pan sideways and lose the header). It sits on main, not body,
            because phones pass body overflow up to the viewport and still pan; clip keeps sticky working. */}
        <main id="main" className="flex-1 overflow-x-clip">
          {children}
        </main>
        <ShopOnly>
          <Footer />
        </ShopOnly>
        <BagDrawer />
        <InputModality />
      </body>
    </html>
  );
}
