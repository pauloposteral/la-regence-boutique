// La Régence — Service Worker
// Strategies:
// - Static assets (JS/CSS/fonts/images): cache-first
// - HTML navigation: network-first with cache fallback
// - Supabase API: network-only (always fresh)

const VERSION = "v2-tv-player-20261111";
const STATIC_CACHE = `lr-static-${VERSION}`;
const RUNTIME_CACHE = `lr-runtime-${VERSION}`;

const PRECACHE_URLS = ["/", "/manifest.json", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => Promise.all(clients.map((client) => {
        const url = new URL(client.url);
        // A newly activated worker refreshes only the TV screen, once. Preserve
        // its selected video/query; never interrupt uploads, checkout or login.
        if (url.origin !== self.location.origin || url.pathname !== "/video") return;
        return client.navigate(client.url).catch(() => undefined);
      })))
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip cross-origin auth/api calls
  if (url.hostname.includes("supabase.co") || url.hostname.includes("stripe.com")) {
    return;
  }

  // Navigation: network-first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Same-origin static assets: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok && (request.destination === "image" || request.destination === "style" || request.destination === "script" || request.destination === "font")) {
              const clone = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
            }
            return res;
          })
      )
    );
  }
});
