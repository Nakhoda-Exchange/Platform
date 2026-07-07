// Minimal service worker. Its only jobs are (1) making the app installable —
// which requires a live fetch handler — and (2) caching immutable static assets
// so the shell loads fast / survives a flaky connection.
//
// It deliberately does NOT intercept navigations or RSC/data requests. An
// earlier version cached HTML network-first and served stale documents, which
// broke Next's streamed RSC and showed up as constant reload loops. So here we
// pass everything except versioned static assets straight to the network,
// untouched. Bump CACHE to invalidate old entries.
const CACHE = "nakhoda-static-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Only these are content-hashed / immutable and safe to cache: Next's build
// output and our own static icons/fonts. Everything else (documents, RSC
// payloads, `_next/data`, API, Goftino) is left to the network.
function isCacheableAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.startsWith("/fonts/"))
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || !isCacheableAsset(url)) return;

  // Cache-first: these URLs are versioned, so a hit is always correct.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
