"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Coin } from "@/lib/core/domain/market/coin";
import {
  CHART_RANGES,
  type Candle,
  type ChartRange,
  type PricePoint,
} from "@/lib/core/domain/market/coin-detail";
import type { ChartRangeDef } from "@/components/ui/live-area-chart";
import type { CandleRangeDef } from "@/components/ui/candle-chart";
import { CandlestickIcon, LineChartIcon } from "@/components/ui/icons";
import { formatChangePercent, formatIrt, formatUsd } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

// echarts only downloads when a PDP is opened, not with the app shell.
// The fallback is a plain empty card at the real card's height (360px)
// so the chart swaps in with zero layout jump.
const LiveAreaChart = dynamic(
  () => import("@/components/ui/live-area-chart").then((m) => m.LiveAreaChart),
  {
    ssr: false,
    loading: () => (
      <div aria-hidden className="h-[360px] rounded-card bg-surface" />
    ),
  },
);

// Loaded only when the trader toggles to candles.
const CandleChart = dynamic(
  () => import("@/components/ui/candle-chart").then((m) => m.CandleChart),
  {
    ssr: false,
    loading: () => (
      <div aria-hidden className="h-[360px] rounded-card bg-surface" />
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
  candles,
}: {
  coin: Coin;
  series: Record<ChartRange, PricePoint[]>;
  candles: Record<ChartRange, Candle[]>;
}) {
  const [view, setView] = useState<"area" | "candles">("area");
  const up = coin.change24h >= 0;
  const ranges: ChartRangeDef[] = CHART_RANGES.map((key) => ({
    key,
    label: RANGE_LABELS[key],
    points: series[key].map((p) => ({ at: p.at, value: p.priceIrt })),
    showTime: key === "24h",
  }));

  const candleRanges: CandleRangeDef[] = CHART_RANGES.map((key) => ({
    key,
    label: RANGE_LABELS[key],
    candles: candles[key],
    showTime: key === "24h",
  }));

  const toggle = (
    <div role="radiogroup" aria-label="نوع نمودار" className="flex gap-1">
      {(
        [
          { key: "area", label: "نمودار خطی", Icon: LineChartIcon },
          { key: "candles", label: "نمودار شمعی", Icon: CandlestickIcon },
        ] as const
      ).map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={view === key}
          aria-label={label}
          onClick={() => setView(key)}
          className={cn(
            "flex size-9 items-center justify-center rounded-field transition-colors",
            view === key
              ? "bg-brand/10 text-brand"
              : "text-placeholder hover:text-muted",
          )}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  );

  if (view === "candles") {
    return (
      <CandleChart
        ranges={candleRanges}
        formatValue={formatIrt}
        ariaLabel={`نمودار شمعی ${coin.name}`}
        toolbar={toggle}
      />
    );
  }

  return (
    <LiveAreaChart
      ranges={ranges}
      formatValue={formatIrt}
      ariaLabel={`نمودار قیمت ${coin.name}`}
      toolbar={toggle}
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
