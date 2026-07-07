import type { PeriodPerformance } from "@/lib/core/domain/market/past-performance";
import type { ChartRange } from "@/lib/core/domain/market/coin-detail";
import { formatChangePercent } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

const PERIOD_LABELS: Record<ChartRange, string> = {
  "24h": "۲۴ ساعت",
  "7d": "۷ روز",
  "1m": "۱ ماه",
  "1y": "۱ سال",
};

/**
 * «عملکرد گذشته» — how the price moved over each period, one glance per
 * cell: period label on top, the move under it (gain-green / loss-red;
 * direction is worded in the aria-label for screen readers).
 */
export function PastPerformanceCard({
  performance,
}: {
  performance: PeriodPerformance[];
}) {
  if (performance.length === 0) return null;

  return (
    <section aria-label="عملکرد گذشته" className="flex flex-col gap-2">
      <h2 className="text-[16px] font-bold text-ink">عملکرد گذشته</h2>
      <dl
        className={cn(
          "grid divide-x divide-x-reverse divide-line rounded-card bg-surface py-4",
          performance.length === 4 ? "grid-cols-4" : "grid-cols-3",
        )}
      >
        {performance.map(({ range, changePercent }) => {
          const up = changePercent >= 0;
          return (
            <div
              key={range}
              className="flex flex-col items-center gap-1.5 px-2"
            >
              <dt className="text-[12px] text-muted">{PERIOD_LABELS[range]}</dt>
              <dd
                dir="ltr"
                aria-label={`${up ? "افزایش" : "کاهش"} ${formatChangePercent(changePercent)} در ${PERIOD_LABELS[range]} گذشته`}
                className={cn(
                  "text-[14px] font-bold",
                  up ? "text-gain" : "text-loss",
                )}
              >
                {formatChangePercent(changePercent)}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
