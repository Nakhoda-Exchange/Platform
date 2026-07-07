/**
 * Branded splash overlay — rendered server-side so it paints instantly on load
 * (no flash), then faded out by SplashHider once the app is ready. Identical on
 * web and installed PWA; its brand background matches the manifest splash.
 */
export function SplashScreen() {
  return (
    <div id="app-splash" aria-hidden>
      <div className="splash-logo">
        <svg
          width="76"
          height="76"
          viewBox="0 0 20 20"
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 4.9996V18.334M10 4.9996C10.9205 4.9996 11.6667 4.25335 11.6667 3.3328C11.6667 2.41225 10.9205 1.666 10 1.666C9.07953 1.666 8.33333 2.41225 8.33333 3.3328C8.33333 4.25335 9.07953 4.9996 10 4.9996ZM15.8333 10.8334L17.5 10C17.5 11.9893 16.7098 13.8971 15.3033 15.3037C13.8968 16.7104 11.9891 17.5006 10 17.5006C8.01088 17.5006 6.10322 16.7104 4.6967 15.3037C3.29018 13.8971 2.5 11.9893 2.5 10L4.16667 10.8334M7.5 9.1666H12.5" />
        </svg>
        <span className="splash-word">ناخدا</span>
      </div>
      <div className="splash-spinner" />
    </div>
  );
}
