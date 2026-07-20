import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GoftinoChat } from "@/components/support/goftino-chat";
import { SplashScreen } from "@/components/pwa/splash-screen";
import { SplashHider } from "@/components/pwa/splash-hider";
import { ToastProvider } from "@/components/ui/toast";
import { LiveTradeToaster } from "@/components/realtime/live-trade-toaster";

// The platform is the app, not the marketing site: it's per-user and data-
// driven. Every route under this group now renders on the CLIENT and fetches
// its per-user data in the browser from same-origin `/api/*` BFF handlers
// (each of which is itself `force-dynamic`). Because no page under this layout
// touches per-request server state anymore, the group no longer needs
// `force-dynamic` here — the page shells prerender to static HTML and the data
// streams in client-side, which is the intended CSR behavior.

/**
 * Wraps the authenticated app (market, wallet, account) in the platform
 * shell. `header` is the `@header` parallel-route slot: a page that needs
 * its own app bar defines `@header/<route>/page.tsx`; every other route is
 * covered by the slot's catch-all/default, which render the standard
 * config-driven header.
 */
export default function AppLayout({
  children,
  header,
}: {
  children: ReactNode;
  header: ReactNode;
}) {
  return (
    <ToastProvider>
      {/* Branded PWA splash — only over the app, never the marketing site. */}
      <SplashScreen />
      <AppShell header={header}>{children}</AppShell>
      <SplashHider />
      <GoftinoChat />
      {/* Live prices + trade toasts stream over the WebSocket while the app is open. */}
      <LiveTradeToaster />
    </ToastProvider>
  );
}
