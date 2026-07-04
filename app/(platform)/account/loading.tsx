/** Skeleton for the account hub (route-level Suspense fallback). */
export default function AccountLoading() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="size-20 animate-pulse rounded-full bg-surface" />
        <div className="h-5 w-32 animate-pulse rounded bg-surface" />
        <div className="h-4 w-24 animate-pulse rounded bg-surface" />
      </div>
      <ul className="flex flex-col">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 border-b border-line py-3 last:border-0"
          >
            <div className="size-10 animate-pulse rounded-field bg-surface" />
            <div className="h-4 w-32 animate-pulse rounded bg-surface" />
          </li>
        ))}
      </ul>
    </div>
  );
}
