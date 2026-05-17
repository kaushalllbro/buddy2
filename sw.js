/* BuddyChat service worker — offline shell + push notifications */
const CACHE = "buddychat-v1";
const SHELL = [
  "index.html",
  "config.js",
  "manifest.json",
  "icons/icon-72.png",
  "icons/icon-96.png",
  "icons/icon-128.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable.png",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Network-first for HTML, cache-first for static assets
  if (req.mode === "navigate" || req.destination === "document") {
    e.respondWith(
      fetch(req).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return r;
      }).catch(() => caches.match("index.html"))
    );
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then((cached) =>
        cached ||
        fetch(req).then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return r;
        }).catch(() => cached)
      )
    );
  }
});

// Push notifications (FCM sends a "push" event in the background)
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { title: "BuddyChat", body: e.data && e.data.text() }; }
  const n = data.notification || data;
  const title = n.title || "BuddyChat";
  const opts = {
    body: n.body || "",
    icon: "icons/icon-192.png",
    badge: "icons/icon-96.png",
    vibrate: [80, 40, 80],
    data: data.data || {},
    tag: (data.data && data.data.tag) || "buddychat",
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then((cs) => {
    for (const c of cs) { if ("focus" in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow("index.html");
  }));
});
