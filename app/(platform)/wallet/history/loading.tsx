/** Skeleton for the history timeline (route-level Suspense fallback). */
export default function HistoryLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4">
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-16 animate-pulse rounded-full bg-surface"
          />
        ))}
      </div>
      <div className="h-4 w-14 animate-pulse rounded bg-surface" />
      <ul className="flex flex-col">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center justify-between border-b border-line py-3 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="size-[42px] animate-pulse rounded-full bg-surface" />
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-28 animate-pulse rounded bg-surface" />
                <div className="h-3 w-20 animate-pulse rounded bg-surface" />
              </div>
            </div>
            <div className="h-4 w-24 animate-pulse rounded bg-surface" />
          </li>
        ))}
      </ul>
    </div>
  );
}
