/** Skeleton shown while the market list loads (route-level Suspense fallback). */
export default function MarketLoading() {
  return (
    <div className="flex flex-1 flex-col gap-3 px-4 pb-6 pt-4">
      <div className="h-6 w-16 rounded bg-surface" />
      <ul className="flex flex-col">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center justify-between border-b border-line py-3 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 animate-pulse rounded-full bg-surface" />
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-20 animate-pulse rounded bg-surface" />
                <div className="h-3 w-10 animate-pulse rounded bg-surface" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-1.5">
                <div className="h-4 w-24 animate-pulse rounded bg-surface" />
                <div className="h-3 w-12 animate-pulse rounded bg-surface" />
              </div>
              <div className="h-6 w-14 animate-pulse rounded-lg bg-surface" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
