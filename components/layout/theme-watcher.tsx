"use client";

import { useEffect } from "react";
import { THEME_STORAGE_KEY } from "@/lib/utils/theme";

/**
 * Follows OS theme changes live while the user hasn't chosen an override
 * (the pre-paint script in the root layout handles the initial load).
 */
export function ThemeWatcher() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(THEME_STORAGE_KEY)) return; // user override wins
      } catch {
        /* fall through — follow the system */
      }
      document.documentElement.classList.toggle("dark", e.matches);
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);
  return null;
}
