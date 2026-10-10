import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// What Android uses when someone adds the site to their home screen: the cream icon, the short name
// under it, and a cream splash while it opens. minimal-ui opens it in its own window but keeps a back
// button (the site isn't an offline app, so it shouldn't pretend to be one).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.shortName,
    short_name: site.shortName,
    description: site.description,
    start_url: "/",
    display: "minimal-ui",
    background_color: "#fff7ed",
    theme_color: "#fff7ed",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
