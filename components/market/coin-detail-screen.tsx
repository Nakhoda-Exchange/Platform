import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { summarizeIndicators } from "@/lib/core/domain/market/indicator-summary";
import { pastPerformance } from "@/lib/core/domain/market/past-performance";
import { PriceChart } from "./price-chart";
import { CoinStats } from "./coin-stats";
import { IndicatorSummaryCard } from "./indicator-summary-card";
import { PastPerformanceCard } from "./past-performance-card";

/**
 * Coin detail page (PDP). The coin's identity (icon, name, symbol, favorite,
 * history) lives in the app bar — see CoinPageHeader via the `@header` slot.
 * The screen itself: the live price-chart card (the card headline IS the
 * price — live-ticking, with USD + 24h change as the idle subhead), market
 * stats, and an «about» blurb. Trading happens from the market list via the
 * swipe quick-action, so the PDP stays a focused, read-only overview.
 */
export function CoinDetailScreen({ detail }: { detail: CoinDetail }) {
  const { coin } = detail;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-4">
      <PriceChart coin={coin} series={detail.series} candles={detail.candles} />

      <IndicatorSummaryCard
        summary={summarizeIndicators(coin.change24h, detail.series)}
      />

      <PastPerformanceCard performance={pastPerformance(detail.series)} />

      <CoinStats detail={detail} />

      {/* About */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[16px] font-bold text-ink">درباره‌ی {coin.name}</h2>
        <p className="text-[15px] leading-7 text-muted">{detail.description}</p>
      </section>
    </div>
  );
}
