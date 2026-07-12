/** Theme preference: follow the OS, or an explicit light/dark choice. */
export type ThemePref = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/**
 * The stored preference. New visitors default to **dark** — the app's default
 * scheme. "system" is stored explicitly (not the absence of a key) so it stays
 * distinct from "never chosen". Client-only.
 */
export function getThemePref(): ThemePref {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    /* storage unavailable — fall through to the default */
  }
  return "dark";
}

/** Persist a preference and apply it to <html> immediately. Client-only. */
export function applyThemePref(pref: ThemePref): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* storage can be unavailable (private mode) — still apply visually */
  }
  const dark =
    pref === "dark" ||
    (pref === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

/**
 * Pre-paint theme script, inlined as the FIRST element of <body> so the class
 * lands before anything renders (no flash of the wrong theme). Default is dark:
 * only an explicit "light" or "system" preference opts out. Must stay
 * dependency-free and in sync with applyThemePref.
 */
export const THEME_INIT_SCRIPT = `(()=>{try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=t==="light"?false:t==="system"?matchMedia("(prefers-color-scheme: dark)").matches:true;document.documentElement.classList.toggle("dark",d)}catch(e){document.documentElement.classList.add("dark")}})()`;
