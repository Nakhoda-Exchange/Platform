import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";

/**
 * Authenticated app chrome: sticky header, scrollable content, floating
 * bottom nav. The header arrives through the `@header` parallel-route slot —
 * pages with their own header (e.g. the coin detail page) define a slot page;
 * everything else falls back to the config-driven `PlatformHeader`.
 */
export function AppShell({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-paper">
      {header}
      <main className="flex flex-1 flex-col">{children}</main>
      <BottomNav />
    </div>
  );
}
