"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production (needed for PWA install + offline).
 *
 * In development it does the opposite: unregisters any existing SW and clears
 * caches. A SW must never run against the dev server — it caches Turbopack's
 * ephemeral HMR chunks and then serves stale/missing ones on reload, which
 * surfaces as `ChunkLoadError`. A SW also lingers across branch switches, so we
 * proactively tear it down here.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()));
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // registration failures are non-fatal (e.g. http without TLS)
    });
  }, []);

  return null;
}
