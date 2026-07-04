// Self-destroying "kill-switch" service worker (an uninstaller, not a PWA).
//
// The app no longer uses a service worker. But browsers that installed an
// earlier build's SW still have one registered at /sw.js, and it keeps
// intercepting navigations / serving stale content — which breaks Next's
// streamed RSC pages and shows up as constant reloading. Deleting this file
// does NOT help: a 404 on the browser's update check leaves the old SW in
// place. So we must SERVE a replacement that removes itself.
//
// On the browser's next update check it installs this, and on activate it
// clears every cache and unregisters itself — silently. It must NOT reload the
// page (an earlier version called clients.navigate() here and caused reloads);
// the next normal navigation is already SW-free. Once we're confident no
// browser still has an old SW, this file can be deleted.
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
