import Link from "next/link";
import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { summarizeIndicators } from "@/lib/core/domain/market/indicator-summary";
import { pastPerformance } from "@/lib/core/domain/market/past-performance";
import { PriceChart } from "./price-chart";
import { IndicatorSummaryCard } from "./indicator-summary-card";
import { PastPerformanceCard } from "./past-performance-card";
import { buttonClasses } from "@/components/ui/button";
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
        // Your position, said plainly — no card, just a quiet line.
        <p className="px-1 text-[14px] leading-7 text-muted">
          شما{" "}
          <span dir="ltr" className="font-extrabold text-ink">
            {formatCoinAmount(holding.amount)} {coin.symbol}
          </span>{" "}
          از این رمزارز دارید، معادل{" "}
          <span dir="ltr" className="font-bold text-ink">
            {formatIrt(holding.valueIrt)}
          </span>
          .
        </p>
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
