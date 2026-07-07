import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GoftinoChat } from "@/components/support/goftino-chat";

// The platform is the app, not the marketing site: it's per-user and data-
// driven, so nothing under this group should be prerendered at build (that
// would bake mock/stale data into static HTML). Forcing dynamic makes every
// platform route render on demand; only the marketing site stays static.
// Cascades to all nested routes in the (platform) group.
export const dynamic = "force-dynamic";

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
    <>
      <AppShell header={header}>{children}</AppShell>
      <GoftinoChat />
    </>
  );
}
