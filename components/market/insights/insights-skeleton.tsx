/** Streaming fallback for the insights section — panel-shaped shimmer rows so
 *  the layout doesn't jump when the real panels arrive. */
export function InsightsSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-hidden>
      <div className="h-5 w-24 rounded bg-surface" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4"
        >
          <div className="h-4 w-32 rounded bg-line" />
          <div className="h-3 w-full rounded bg-line" />
          <div className="h-3 w-2/3 rounded bg-line" />
        </div>
      ))}
    </div>
  );
}
