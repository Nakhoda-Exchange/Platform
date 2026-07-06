import type { ReactNode } from "react";

/**
 * The platform app-bar chrome: sticky, RTL, safe-area aware. Every header
 * (the default config-driven one and per-page ones rendered through the
 * `@header` slot) composes this so the bar reads identically everywhere.
 * `start` is the right side in RTL (back/identity), `end` the left (actions).
 */
export function HeaderBar({
  start,
  end,
}: {
  start: ReactNode;
  end: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <div className="flex items-center gap-1">{start}</div>
      <div className="flex items-center gap-2">{end}</div>
    </header>
  );
}
