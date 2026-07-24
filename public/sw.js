// Minimal service worker — just enough for real PWA installability
// (Android/TWA and "Add to Home Screen" both require an active SW with a
// fetch handler) plus a genuine offline fallback. This app is dynamic and
// auth-gated, so it deliberately does NOT try to cache pages or API
// responses — only the static build output and an offline page.
const CACHE_NAME = "ogc-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Page navigations: always prefer the network (this app is dynamic), but
  // show a real offline page instead of the browser's default error screen.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Next.js static build assets are content-hashed and immutable, so a
  // cache-first strategy is safe and speeds up repeat loads / offline use.
  const url = new URL(request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return res;
          })
      )
    );
  }
});
