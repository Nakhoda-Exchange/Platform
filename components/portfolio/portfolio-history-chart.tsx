"use client";

import {
  LiveAreaChart,
  type ChartPoint,
  type ChartRangeDef,
} from "@/components/ui/live-area-chart";
import {
  PORTFOLIO_HISTORY_RANGES,
  type PortfolioHistory,
  type PortfolioHistoryRange,
  type PortfolioValuePoint,
} from "@/lib/core/domain/portfolio/portfolio-history";
import { formatIrtShort } from "@/lib/utils/money";

const RANGE_LABELS: Record<PortfolioHistoryRange, string> = {
  daily: "روزانه",
  weekly: "هفتگی",
  monthly: "ماهانه",
};

function toChartPoint(p: PortfolioValuePoint): ChartPoint {
  return {
    at: p.at,
    value: p.valueIrt,
    event: p.event
      ? {
          label: `${p.event.type === "deposit" ? "واریز" : "برداشت"} ${formatIrtShort(p.event.amountIrt)}`,
          direction: p.event.type === "deposit" ? "in" : "out",
        }
      : undefined,
  };
}

/**
 * Account-value chart for the details sheet: the shared LiveAreaChart fed
 * with the portfolio history — deposits/withdrawals become named event dots.
 */
export function PortfolioHistoryChart({
  history,
}: {
  history: PortfolioHistory;
}) {
  const ranges: ChartRangeDef[] = PORTFOLIO_HISTORY_RANGES.map((key) => ({
    key,
    label: RANGE_LABELS[key],
    points: history[key].map(toChartPoint),
    showTime: key === "daily",
  }));

  return (
    <LiveAreaChart
      ranges={ranges}
      formatValue={formatIrtShort}
      ariaLabel="نمودار ارزش دارایی"
    />
  );
}
