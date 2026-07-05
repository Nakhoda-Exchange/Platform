// Client-side instrumentation (Next.js 15.3+): runs once in the browser before
// the app hydrates — the PostHog-recommended init point for the App Router.
import posthog from "posthog-js";

posthog.init("phc_D7gW74NFP8j9vLaGAJTrsmXYkuSsoazCJWRrGXTSmoPS", {
  api_host: "https://us.i.posthog.com",
  defaults: "2026-05-30",
});
