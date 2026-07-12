"use client";

import { useEffect } from "react";
import { THEME_STORAGE_KEY } from "@/lib/utils/theme";

/**
 * Follows OS theme changes live, but only when the user's preference is
 * explicitly "system" (the default is dark, and light/dark are fixed choices).
 * The pre-paint script in the root layout handles the initial load.
 */
export function ThemeWatcher() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(THEME_STORAGE_KEY) !== "system") return; // only «system» follows the OS
      } catch {
        return; // storage unavailable — default (dark) stands
      }
      document.documentElement.classList.toggle("dark", e.matches);
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);
  return null;
}
