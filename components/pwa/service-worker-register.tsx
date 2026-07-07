"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (needed for PWA install + offline).
 *
 * Production only — a SW in dev intercepts and caches Turbopack's HMR chunks,
 * which causes ChunkLoadError and reload loops. In dev we instead unregister
 * any SW a prior prod build left in this browser, so switching to `next dev`
 * doesn't inherit a stale worker.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((reg) => reg.unregister()))
        .catch(() => {});
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // registration failures are non-fatal (e.g. http/dev without TLS)
    });
  }, []);
  return null;
}
