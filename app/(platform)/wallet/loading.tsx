/**
 * Skeleton shown while the portfolio loads (route-level Suspense fallback).
 * Mirrors the real wallet layout — centered hero, the four quick-action icons,
 * and the «دارایی‌های من» list rows — so the page doesn't jump/reflow when the
 * real content swaps in. Keep in sync with PortfolioSummary + HoldingListItem.
 */
export default function WalletLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-6 pt-4">
      {/* Summary: centered hero + quick actions */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2">
          <div className="h-4 w-16 animate-pulse rounded bg-surface" />
          <div className="h-9 w-56 animate-pulse rounded bg-surface" />
          <div className="h-8 w-40 animate-pulse rounded-full bg-surface" />
        </div>
        <nav className="flex items-start justify-between px-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex w-16 flex-col items-center gap-2">
              <div className="size-13 animate-pulse rounded-full bg-surface" />
              <div className="h-3 w-9 animate-pulse rounded bg-surface" />
            </div>
          ))}
        </nav>
      </section>

      {/* «دارایی‌های من»: heading + rows (Toman + coins) */}
      <section className="flex flex-col gap-2">
        <div className="h-5 w-28 animate-pulse rounded bg-surface" />
        <ul className="-mx-4 flex flex-col divide-y divide-line">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="size-[42px] animate-pulse rounded-full bg-surface" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 w-20 animate-pulse rounded bg-surface" />
                  <div className="h-3 w-14 animate-pulse rounded bg-surface" />
                </div>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <div className="h-4 w-24 animate-pulse rounded bg-surface" />
                <div className="h-3 w-12 animate-pulse rounded bg-surface" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
