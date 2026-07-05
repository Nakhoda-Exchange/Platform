"use client";

import dynamic from "next/dynamic";
import type { Coin } from "@/lib/core/domain/market/coin";
import {
  CHART_RANGES,
  type ChartRange,
  type PricePoint,
} from "@/lib/core/domain/market/coin-detail";
import type { ChartRangeDef } from "@/components/ui/live-area-chart";
import { formatChangePercent, formatIrt, formatUsd } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

// echarts only downloads when a PDP is opened, not with the app shell.
// The fallback is a plain empty card at the real card's height (300px)
// so the chart swaps in with zero layout jump.
const LiveAreaChart = dynamic(
  () => import("@/components/ui/live-area-chart").then((m) => m.LiveAreaChart),
  {
    ssr: false,
    loading: () => (
      <div aria-hidden className="h-[300px] rounded-card bg-surface" />
    ),
  },
);

const RANGE_LABELS: Record<ChartRange, string> = {
  "24h": "۲۴ ساعت",
  "7d": "۷ روز",
  "1m": "۱ ماه",
  "1y": "۱ سال",
};

/**
 * PDP price chart: the shared LiveAreaChart fed with the coin's price
 * history. The card headline IS the live price; while idle the subhead
 * shows the USD price and 24h change, and scrubbing swaps it for the
 * peeked moment.
 */
export function PriceChart({
  coin,
  series,
}: {
  coin: Coin;
  series: Record<ChartRange, PricePoint[]>;
}) {
  const up = coin.change24h >= 0;
  const ranges: ChartRangeDef[] = CHART_RANGES.map((key) => ({
    key,
    label: RANGE_LABELS[key],
    points: series[key].map((p) => ({ at: p.at, value: p.priceIrt })),
    showTime: key === "24h",
  }));

  return (
    <LiveAreaChart
      ranges={ranges}
      formatValue={formatIrt}
      ariaLabel={`نمودار قیمت ${coin.name}`}
      idleSubhead={
        <span dir="ltr" className="flex items-center gap-2">
          <span className="text-muted">{formatUsd(coin.priceUsd)}</span>
          <span
            aria-label={`${up ? "افزایش" : "کاهش"} ${formatChangePercent(coin.change24h)} در ۲۴ ساعت`}
            className={cn("font-bold", up ? "text-gain" : "text-loss")}
          >
            {up ? "▲" : "▼"} {formatChangePercent(coin.change24h)}
          </span>
        </span>
      }
    />
  );
}
