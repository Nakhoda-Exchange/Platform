/** Skeleton for the open-orders screen (route-level Suspense fallback). */
export default function OrdersLoading() {
  return (
    <div className="flex flex-1 flex-col gap-2 px-4 pb-6 pt-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-card bg-surface" />
      ))}
    </div>
  );
}
