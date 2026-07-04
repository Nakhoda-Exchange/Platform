// Self-destroying "kill-switch" service worker.
//
// The app no longer uses a service worker (a caching SW broke Next's
// navigation/RSC and caused reload loops). But browsers that installed the old
// SW still have it registered and keep serving stale content. Deleting sw.js
// doesn't help — a 404 on the update check leaves the old SW in place.
//
// So we serve THIS instead: on their next SW update check the browser installs
// it, and on activate it clears all caches and unregisters itself — leaving the
// device with no SW.
//
// It must NOT reload the page. A previous version called client.navigate() on
// activate to force a refresh; that caused a reload loop (each navigation
// triggers an SW update check → re-activate → navigate again). We just evict
// silently; the next natural navigation is already SW-free.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
    })(),
  );
});
