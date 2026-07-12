/**
 * Pre-paint browser gate.
 *
 * The app is built on Tailwind CSS v4, whose hard floor is Safari 16.4 /
 * Chrome 111 / Firefox 128 — it emits `@property` and `color-mix()` with no
 * fallbacks, so anything below can't render the CSS at all (colors and layout
 * break). Rather than show a broken page, feature-detect those two capabilities
 * and send unsupported browsers to the static, Tailwind-free /unsupported.html
 * before anything paints.
 *
 * The detect maps precisely to the floor:
 *   - `color-mix(in oklch, …)` → Chrome 111, Safari 16.2, Firefox 113
 *   - `CSS.registerProperty` (`@property`) → Chrome 85, Safari 16.4, Firefox 128
 * A browser must satisfy BOTH, which lands exactly on 16.4 / 111 / 128.
 *
 * Inlined as the first thing in <body>, so it runs (and redirects) before the
 * broken UI can flash. Must stay dependency-free.
 */
export const BROWSER_SUPPORT_GATE = `(function(){try{var ok=window.CSS&&CSS.supports&&CSS.supports("color","color-mix(in oklch, red, blue)")&&typeof CSS.registerProperty==="function";if(!ok)location.replace("/unsupported.html")}catch(e){location.replace("/unsupported.html")}})()`;
