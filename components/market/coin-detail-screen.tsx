import Link from "next/link";
import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { summarizeIndicators } from "@/lib/core/domain/market/indicator-summary";
import { pastPerformance } from "@/lib/core/domain/market/past-performance";
import { PriceChart } from "./price-chart";
import { IndicatorSummaryCard } from "./indicator-summary-card";
import { PastPerformanceCard } from "./past-performance-card";
import { buttonClasses } from "@/components/ui/button";
import {
  formatChangePercent,
  formatCoinAmount,
  formatIrt,
} from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/** What the viewer holds of this coin, when they hold any. */
export type CoinHolding = { amount: number; valueIrt: number; costIrt: number };

/**
 * The viewer's position, summarized above the chart: the Toman value of the
 * holding, the coin amount behind it, and the P&L on that value.
 */
function HoldingSummary({
  holding,
  symbol,
}: {
  holding: CoinHolding;
  symbol: string;
}) {
  const profit = holding.valueIrt - holding.costIrt;
  const up = profit >= 0;
  const percent = holding.costIrt > 0 ? (profit / holding.costIrt) * 100 : 0;

  // Label on the left, figure on the right — so the figure leads in DOM order
  // (RTL puts the first flex child at the right edge).
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-muted">دارایی شما</span>
        <span dir="ltr" className="text-[19px] font-extrabold text-ink">
          {formatIrt(holding.valueIrt)}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-muted">معادل</span>
        <span dir="ltr" className="text-[14px] font-bold text-ink">
          {formatCoinAmount(holding.amount)} {symbol}
        </span>
      </div>

      <div className="border-t border-line" />

      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-muted">سود و زیان</span>
        <span
          dir="ltr"
          aria-label={`${up ? "سود" : "زیان"} ${formatIrt(Math.abs(profit))} معادل ${formatChangePercent(percent)}`}
          className={cn(
            "text-[14px] font-bold",
            up ? "text-gain" : "text-loss",
          )}
        >
          {formatIrt(Math.abs(profit))}
        </span>
      </div>
    </section>
  );
}

/**
 * Coin detail page (PDP). The coin's identity (icon, name, symbol, favorite,
 * history) lives in the app bar — see CoinPageHeader via the `@header` slot.
 * The screen itself: the live price-chart card (the card headline IS the
 * price), market stats, an «about» blurb, and — when the viewer holds this
 * coin — a holding card up top and a «فروش» action next to «خرید». Buyers who
 * hold nothing see a buy-only bar.
 */
export function CoinDetailScreen({
  detail,
  holding,
}: {
  detail: CoinDetail;
  holding?: CoinHolding;
}) {
  const { coin } = detail;
  const trade = coin.symbol.toLowerCase();
  const canSell = holding !== undefined;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-4">
      {holding ? (
        <HoldingSummary holding={holding} symbol={coin.symbol} />
      ) : null}

      <PriceChart coin={coin} series={detail.series} candles={detail.candles} />

      <IndicatorSummaryCard
        summary={summarizeIndicators(coin.change24h, detail.series)}
      />

      <PastPerformanceCard performance={pastPerformance(detail.series)} />

      {/* About + history */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[16px] font-bold text-ink">درباره‌ی {coin.name}</h2>
        <p className="text-[15px] leading-7 text-muted">{detail.description}</p>
        <p className="text-[15px] leading-7 text-muted">{detail.history}</p>
      </section>

      {/* Sticky action bar → Trade screen. «فروش» shows only when the viewer
          holds this coin; otherwise it's a buy-only bar. Full bleed with its
          own background + top divider so it reads as a bar over the content. */}
      <div className="sticky bottom-0 -mx-4 mt-auto flex gap-3 border-t border-line bg-paper px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        <Link
          href={`/trade/${trade}?side=buy`}
          className={buttonClasses({ size: "lg", fullWidth: true })}
        >
          خرید
        </Link>
        {canSell ? (
          <Link
            href={`/trade/${trade}?side=sell`}
            className={buttonClasses({
              variant: "ghost",
              size: "lg",
              fullWidth: true,
              className: "border border-line bg-surface",
            })}
          >
            فروش
          </Link>
        ) : null}
      </div>
    </div>
  );
}
