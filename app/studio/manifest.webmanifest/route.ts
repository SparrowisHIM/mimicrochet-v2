// Mimi's studio as an app on her home screen: it opens straight on her orders, in its own window
// (iPhones only allow notifications for a page added to the home screen like this).
export function GET() {
  return Response.json(
    {
      id: "/studio",
      name: "Mimi’s orders",
      short_name: "Orders",
      start_url: "/studio",
      scope: "/studio",
      display: "standalone",
      background_color: "#fff7ed",
      theme_color: "#fff7ed",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
