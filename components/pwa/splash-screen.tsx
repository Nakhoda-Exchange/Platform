import { Logo } from "@/components/layout/logo";

/**
 * Branded splash overlay — rendered server-side so it paints instantly on load
 * (no flash), then faded out by SplashHider once the app is ready. Identical on
 * web and installed PWA; its brand background matches the manifest splash.
 * Uses the shared Logo (the one place the mark is defined), tuned white for the
 * brand background.
 */
export function SplashScreen() {
  return (
    <div id="app-splash" aria-hidden>
      <div className="splash-logo">
        <Logo size={40} href={null} layout="stack" />
      </div>
      <div className="splash-spinner" />
    </div>
  );
}
