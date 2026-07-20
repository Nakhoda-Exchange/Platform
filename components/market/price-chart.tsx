"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { Coin } from "@/lib/core/domain/market/coin";
import { parsePrice } from "@/lib/core/domain/market/price";
import {
  CHART_RANGES,
  type Candle,
  type ChartRange,
  type CoinChart,
  type PricePoint,
} from "@/lib/core/domain/market/coin-detail";
import type { ChartRangeDef } from "@/components/ui/live-area-chart";
import type { CandleRangeDef } from "@/components/ui/candle-chart";
import { CandlestickIcon, LineChartIcon } from "@/components/ui/icons";
import { formatChangePercent, formatIrt, formatUsd } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import { useLivePrices } from "@/lib/realtime/use-realtime";

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
  // Real live price from the WebSocket feed (null until the first tick / when
  // the feed is quiet) — the chart's tail tracks this, never a simulated value.
  const { prices } = useLivePrices();
  const liveValue = prices[coin.id]?.priceIrt ?? null;

  // The detail payload carries only the 24h range inline; 7d/1m/1y load lazily
  // from the chart endpoint on range toggle. Seed the loaded map with whatever
  // ranges arrived inline (24h in practice). Guard every read: a brand-new /
  // thin coin arrives with no history at all and must never crash.
  const [loaded, setLoaded] = useState<Partial<Record<ChartRange, CoinChart>>>(
    () => {
      const seed: Partial<Record<ChartRange, CoinChart>> = {};
      for (const key of CHART_RANGES) {
        const s = series?.[key];
        const c = candles?.[key];
        if ((s?.length ?? 0) > 0 || (c?.length ?? 0) > 0) {
          seed[key] = { series: s ?? [], candles: c ?? [] };
        }
      }
      return seed;
    },
  );
  const [status, setStatus] = useState<
    Partial<Record<ChartRange, "loading" | "error">>
  >({});

  // Fetch-on-range-toggle: pull one range's real history from the BFF the first
  // time it's selected. Empty payload → the range renders an honest "no data for
  // this range yet" note (stored so we don't refetch); a failure → a retry note.
  const loadRange = useCallback(
    async (key: ChartRange) => {
      if (loaded[key] || status[key] === "loading") return;
      setStatus((s) => ({ ...s, [key]: "loading" }));
      try {
        const res = await fetch(
          `/api/market/${encodeURIComponent(coin.id)}/chart?timeframe=${key}`,
          { headers: { Accept: "application/json" } },
        );
        if (!res.ok) throw new Error("chart fetch failed");
        const body = (await res.json()) as Partial<CoinChart>;
        setLoaded((l) => ({
          ...l,
          [key]: { series: body.series ?? [], candles: body.candles ?? [] },
        }));
        setStatus((s) => {
          const next = { ...s };
          delete next[key];
          return next;
        });
      } catch {
        setStatus((s) => ({ ...s, [key]: "error" }));
      }
    },
    [loaded, status, coin.id],
  );

  // The 24h range is the gate: with no 24h line, the coin has no history yet →
  // show the price with a graceful empty-state card (never a blank/broken plot).
  const has24h = (loaded["24h"]?.series.length ?? 0) >= 2;
  if (!has24h) {
    return <NoChart coin={coin} />;
  }

  // All four ranges are always offered; each resolves to real data, a loading
  // note, or an honest "no data yet" note — so the chart is truthful about how
  // much history actually exists instead of faking a full past.
  const ranges: ChartRangeDef[] = CHART_RANGES.map((key) => ({
    key,
    label: RANGE_LABELS[key],
    points: (loaded[key]?.series ?? []).map((p) => ({
      at: p.at,
      value: p.priceIrt,
    })),
    showTime: key === "24h",
    status: status[key],
  }));

  const candleRanges: CandleRangeDef[] = CHART_RANGES.flatMap((key) => {
    const cs = loaded[key]?.candles ?? [];
    return cs.length >= 1
      ? [
          {
            key,
            label: RANGE_LABELS[key],
            candles: cs,
            showTime: key === "24h",
          },
        ]
      : [];
  });
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

  const chart =
    view === "candles" && hasCandles ? (
      <CandleChart
        ranges={candleRanges}
        formatValue={formatIrt}
        ariaLabel={`نمودار شمعی ${coin.name}`}
        toolbar={toggle}
      />
    ) : (
      <LiveAreaChart
        ranges={ranges}
        formatValue={formatIrt}
        ariaLabel={`نمودار قیمت ${coin.name}`}
        toolbar={toggle}
        idleSubhead={<PriceSubhead coin={coin} />}
        liveValue={liveValue}
        fallbackValue={liveValue ?? parsePrice(coin.priceIrt)}
        onRangeSelect={(k) => void loadRange(k as ChartRange)}
      />
    );

  return (
    <div className="flex flex-col gap-2">
      {chart}
      {coin.isNew ? (
        <p className="px-1 text-[12px] leading-6 text-muted">
          این رمزارز به‌تازگی فهرست شده و تاریخچه‌ی قیمت آن هنوز کامل نیست؛
          نمودار به‌مرور تکمیل می‌شود.
        </p>
      ) : null}
    </div>
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
