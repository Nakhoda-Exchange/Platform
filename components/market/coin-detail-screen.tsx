import Link from "next/link";
import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { summarizeIndicators } from "@/lib/core/domain/market/indicator-summary";
import { pastPerformance } from "@/lib/core/domain/market/past-performance";
import { PriceChart } from "./price-chart";
import { IndicatorSummaryCard } from "./indicator-summary-card";
import { PastPerformanceCard } from "./past-performance-card";
import { CoinBlogPosts } from "./coin-blog-posts";
import { buttonClasses } from "@/components/ui/button";

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
  const trade = coin.symbol.toLowerCase();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-4">
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

      <CoinBlogPosts posts={detail.blogPosts} />

      {/* Sticky Buy/Sell bar → Trade screen (which gates selling itself). Full
          bleed with its own background + top divider so it reads as a bar over
          the scrolling content. */}
      <div className="sticky bottom-0 -mx-4 mt-auto flex gap-3 border-t border-line bg-paper px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        <Link
          href={`/trade/${trade}?side=buy`}
          className={buttonClasses({ size: "lg", fullWidth: true })}
        >
          خرید
        </Link>
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
      </div>
    </div>
  );
}
