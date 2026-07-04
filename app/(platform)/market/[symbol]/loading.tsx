/** Skeleton for the coin detail page (route-level Suspense fallback). */
export default function CoinDetailLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-4">
      <div className="flex items-center gap-3">
        <div className="size-[52px] animate-pulse rounded-full bg-surface" />
        <div className="flex flex-col gap-1.5">
          <div className="h-5 w-24 animate-pulse rounded bg-surface" />
          <div className="h-3 w-12 animate-pulse rounded bg-surface" />
        </div>
      </div>
      <div className="h-8 w-40 animate-pulse rounded bg-surface" />
      <div className="h-[150px] w-full animate-pulse rounded-card bg-surface" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-card bg-surface" />
        ))}
      </div>
    </div>
  );
}
