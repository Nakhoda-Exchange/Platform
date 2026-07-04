/** Skeleton for the withdraw screen (route-level Suspense fallback). */
export default function WithdrawLoading() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      <div className="h-13 animate-pulse rounded-full bg-surface" />
      <div className="h-12 animate-pulse rounded-field bg-surface" />
      <div className="h-12 animate-pulse rounded-field bg-surface" />
      <div className="h-24 animate-pulse rounded-card bg-surface" />
      <div className="mt-auto h-14 animate-pulse rounded-full bg-surface" />
    </div>
  );
}
