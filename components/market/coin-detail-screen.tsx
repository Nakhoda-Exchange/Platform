import Link from "next/link";
import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { PriceChart } from "./price-chart";
import { CoinStats } from "./coin-stats";
import { buttonClasses } from "@/components/ui/button";

/**
 * Coin detail page (PDP). The coin's identity (icon, name, symbol, favorite,
 * history) lives in the app bar — see CoinPageHeader via the `@header` slot.
 * The screen itself: the live price-chart card (the card headline IS the
 * price — live-ticking, with USD + 24h change as the idle subhead), market
 * stats, an «about» blurb, and sticky Buy/Sell CTAs that deep-link into the
 * Trade screen (#7) with this coin preselected.
 */
export function CoinDetailScreen({
  detail,
  canSell,
}: {
  detail: CoinDetail;
  canSell: boolean;
}) {
  const { coin } = detail;
  const trade = coin.symbol.toLowerCase();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-4">
      <PriceChart coin={coin} series={detail.series} candles={detail.candles} />

      <CoinStats detail={detail} />

      {/* About */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[16px] font-bold text-ink">درباره‌ی {coin.name}</h2>
        <p className="text-[15px] leading-7 text-muted">{detail.description}</p>
      </section>

      {/* CTAs → Trade (#7), coin + side preselected. Sticky just above the
          floating bottom nav so they stay reachable while reading; فروش
          only exists when the user actually holds this coin. */}
      <div className="sticky bottom-[calc(6.75rem+env(safe-area-inset-bottom))] z-10 flex gap-3">
        <Link
          href={`/trade/${trade}?side=buy`}
          className={buttonClasses({
            size: "lg",
            fullWidth: true,
            className: "shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
          })}
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
              className:
                "border border-line bg-paper shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
            })}
          >
            فروش
          </Link>
        ) : null}
      </div>
    </div>
  );
}
