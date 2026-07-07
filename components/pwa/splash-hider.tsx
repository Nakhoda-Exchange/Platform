"use client";

import { useEffect } from "react";

const MIN_VISIBLE_MS = 700;

/**
 * Hides the splash once the app is interactive. Toggles a class on <html> (not
 * the splash node itself) so it never fights React over the SSR-rendered
 * overlay; CSS fades it out.
 */
export function SplashHider() {
  useEffect(() => {
    const start = performance.now();
    const hide = () => document.documentElement.classList.add("splash-done");
    const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - start));
    const timer = window.setTimeout(hide, wait);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
