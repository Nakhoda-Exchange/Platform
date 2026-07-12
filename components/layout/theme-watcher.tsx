"use client";

import { useEffect } from "react";
import { getThemePref } from "@/lib/utils/theme";

/**
 * Keeps <html>.dark in sync with the user's preference on the client:
 * re-asserts it on mount — React can drop the class the pre-paint script set on
 * <html> during hydration, and nothing else re-adds it — and follows OS changes
 * live while the preference is «system». (Initial pre-paint is in the layout.)
 */
export function ThemeWatcher() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const pref = getThemePref();
      const dark = pref === "dark" || (pref === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply(); // re-assert after hydration
    const follow = () => {
      if (getThemePref() === "system") apply();
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);
  return null;
}
