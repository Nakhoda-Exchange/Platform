/** Skeleton for the trade screen (route-level Suspense fallback). */
export default function TradeLoading() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      <div className="h-13 animate-pulse rounded-full bg-surface" />
      <div className="flex items-center gap-3">
        <div className="size-11 animate-pulse rounded-full bg-surface" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-24 animate-pulse rounded bg-surface" />
          <div className="h-3 w-16 animate-pulse rounded bg-surface" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="h-10 w-44 animate-pulse rounded bg-surface" />
      </div>
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-field bg-surface"
          />
        ))}
      </div>
      <div className="h-14 animate-pulse rounded-full bg-surface" />
    </div>
  );
}
