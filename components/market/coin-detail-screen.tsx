import Link from "next/link";
import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { summarizeIndicators } from "@/lib/core/domain/market/indicator-summary";
import { pastPerformance } from "@/lib/core/domain/market/past-performance";
import { PriceChart } from "./price-chart";
import { IndicatorSummaryCard } from "./indicator-summary-card";
import { PastPerformanceCard } from "./past-performance-card";
import { buttonClasses } from "@/components/ui/button";
import { WalletIcon } from "@/components/ui/icons";
import { formatCoinAmount, formatIrt } from "@/lib/utils/money";

/** What the viewer holds of this coin, when they hold any. */
export type CoinHolding = { amount: number; valueIrt: number };

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
      <PriceChart coin={coin} series={detail.series} candles={detail.candles} />

      {holding ? (
        // The viewer's position in this coin — a «yours» callout: what you own
        // (right) and what it's worth in Toman (left).
        <div className="flex items-center justify-between gap-3 rounded-card bg-brand-soft px-4 py-4">
          <span className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand"
            >
              <WalletIcon size={20} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[13px] text-muted">دارایی شما</span>
              <span
                dir="ltr"
                className="truncate text-[16px] font-extrabold text-ink"
              >
                {formatCoinAmount(holding.amount)} {coin.symbol}
              </span>
            </span>
          </span>
          <span
            dir="ltr"
            className="shrink-0 text-[14px] font-bold tabular-nums text-ink"
          >
            {formatIrt(holding.valueIrt)}
          </span>
        </div>
      ) : null}

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
