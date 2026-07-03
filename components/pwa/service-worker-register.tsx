"use client";

import { useEffect } from "react";

/** Registers the service worker (needed for PWA install + offline). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // registration failures are non-fatal (e.g. http/dev without TLS)
      });
    }
  }, []);
  return null;
}
