// Mimi's studio notifications. The server sends a small message (lib/server/push.ts); this shows it on
// her phone, even with the site closed, and opens the studio when she taps it. Nothing else: no caching,
// no offline pages.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Mimi’s orders", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Mimi’s orders", {
      body: data.body || "",
      tag: data.tag,
      renotify: Boolean(data.tag),
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/studio" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/studio", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      // Use an open studio window if there is one (and refresh its list), otherwise open one.
      const open = wins.find((w) => new URL(w.url).pathname.startsWith("/studio"));
      if (open) return open.navigate(url).then((w) => (w || open).focus());
      return self.clients.openWindow(url);
    }),
  );
});
