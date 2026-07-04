// Self-destroying "kill-switch" service worker.
//
// The app no longer uses a service worker (a caching SW broke Next's
// navigation/RSC and caused reload loops). But browsers that installed the old
// SW still have it registered and keep serving stale content. Deleting sw.js
// doesn't help — a 404 on the update check leaves the old SW in place.
//
// So we serve THIS instead: on their next SW update check the browser installs
// it, and on activate it unregisters itself, clears all caches, and reloads any
// controlled tab once — leaving the device with no SW.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.registration.unregister();
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) client.navigate(client.url);
    })(),
  );
});
