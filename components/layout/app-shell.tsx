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
  // The platform is a phone app: on desktop we cap it to a phone-width column
  // centred on a plain backdrop, rather than stretching the mobile UI wide.
  // On an actual phone (≤440px) the column just fills the screen — no change.
  return (
    <div className="flex min-h-svh justify-center bg-surface">
      <div className="relative flex min-h-svh w-full max-w-[440px] flex-col bg-paper">
        {header}
        <main className="flex flex-1 flex-col">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
