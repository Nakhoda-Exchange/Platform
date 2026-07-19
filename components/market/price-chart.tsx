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
  series?: Record<ChartRange, PricePoint[]>;
  candles?: Record<ChartRange, Candle[]>;
}) {
  const [view, setView] = useState<"area" | "candles">("area");

  // A range is chartable only with enough points to draw a line (≥2). Newly
  // discovered / thin coins arrive with no price history at all, so the feed
  // omits `series`/`candles` entirely — guard every read and fall back to a
  // graceful «no chart yet» card instead of crashing SSR.
  const areaKeys = CHART_RANGES.filter(
    (key) => (series?.[key]?.length ?? 0) >= 2,
  );
  const candleKeys = CHART_RANGES.filter(
    (key) => (candles?.[key]?.length ?? 0) >= 1,
  );

  // No price history for any range → show the price with an empty-state chart.
  if (areaKeys.length === 0) {
    return <NoChart coin={coin} />;
  }

  const ranges: ChartRangeDef[] = areaKeys.map((key) => ({
    key,
    label: RANGE_LABELS[key],
    points: series![key].map((p) => ({ at: p.at, value: p.priceIrt })),
    showTime: key === "24h",
  }));

  const candleRanges: CandleRangeDef[] = candleKeys.map((key) => ({
    key,
    label: RANGE_LABELS[key],
    candles: candles![key],
    showTime: key === "24h",
  }));
  const hasCandles = candleRanges.length > 0;

  const toggle = hasCandles ? (
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
  ) : null;

  if (view === "candles" && hasCandles) {
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
      idleSubhead={<PriceSubhead coin={coin} />}
    />
  );
}

/** The USD price + 24h change line shown under the headline price. */
function PriceSubhead({ coin }: { coin: Coin }) {
  const up = coin.change24h >= 0;
  return (
    <span dir="ltr" className="flex items-center gap-2">
      <span className="text-muted">{formatUsd(coin.priceUsd)}</span>
      <span
        aria-label={`${up ? "افزایش" : "کاهش"} ${formatChangePercent(coin.change24h)} در ۲۴ ساعت`}
        className={cn("font-bold", up ? "text-gain" : "text-loss")}
      >
        {formatChangePercent(coin.change24h)}
      </span>
    </span>
  );
}

/**
 * Fallback for coins with no price history yet (newly discovered / thin
 * listings). Keeps the price headline the card is built around — current
 * price, USD, 24h change — and replaces the plot with a calm «no chart yet»
 * message instead of crashing or showing an empty box. Same 360px card so the
 * layout matches a coin that does have a chart.
 */
function NoChart({ coin }: { coin: Coin }) {
  return (
    <section
      aria-label={`نمودار قیمت ${coin.name}`}
      className="flex h-[360px] flex-col gap-3 overflow-hidden rounded-card bg-surface p-4"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[20px] font-extrabold tabular-nums text-ink">
          {formatIrt(coin.priceIrt)}
        </span>
        <div className="flex h-5 items-center gap-2 text-[13px]">
          <PriceSubhead coin={coin} />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-line text-placeholder">
          <LineChartIcon size={26} />
        </span>
        <p className="max-w-[240px] text-[14px] leading-7 text-muted">
          نمودار قیمت این رمزارز هنوز در دسترس نیست.
        </p>
      </div>
    </section>
  );
}
