/** Skeleton for the deposit screen (route-level Suspense fallback). */
export default function DepositLoading() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      <div className="h-13 animate-pulse rounded-full bg-surface" />
      <div className="h-12 animate-pulse rounded-field bg-surface" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-10 flex-1 animate-pulse rounded-full bg-surface"
          />
        ))}
      </div>
      <div className="mt-auto h-14 animate-pulse rounded-full bg-surface" />
    </div>
  );
}
