/** Theme preference: follow the OS, or a user override persisted locally. */
export type ThemePref = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/** The stored preference ("system" when nothing is stored). Client-only. */
export function getThemePref(): ThemePref {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : "system";
  } catch {
    return "system";
  }
}

/** Persist a preference and apply it to <html> immediately. Client-only. */
export function applyThemePref(pref: ThemePref): void {
  try {
    if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
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
 * lands before anything renders (no flash of the wrong theme). Must stay
 * dependency-free and in sync with applyThemePref.
 */
export const THEME_INIT_SCRIPT = `(()=>{try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;
