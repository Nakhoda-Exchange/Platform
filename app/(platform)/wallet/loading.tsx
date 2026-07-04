/** Skeleton shown while the portfolio loads (route-level Suspense fallback). */
export default function WalletLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-6 pt-4">
      <div className="flex flex-col items-end gap-2">
        <div className="h-4 w-16 animate-pulse rounded bg-surface" />
        <div className="h-9 w-56 animate-pulse rounded bg-surface" />
        <div className="h-6 w-40 animate-pulse rounded bg-surface" />
      </div>
      <div className="h-[120px] w-full animate-pulse rounded-2xl bg-surface" />
      <div className="flex gap-3">
        <div className="h-14 flex-1 animate-pulse rounded-full bg-surface" />
        <div className="h-14 flex-1 animate-pulse rounded-full bg-surface" />
      </div>
      <ul className="flex flex-col">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center justify-between border-b border-line py-3 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 animate-pulse rounded-full bg-surface" />
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
    </div>
  );
}
