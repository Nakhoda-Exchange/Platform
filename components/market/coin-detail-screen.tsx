import Link from "next/link";
import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { CoinIcon } from "./coin-icon";
import { FavoriteButton } from "./favorite-button";
import { PriceChart } from "./price-chart";
import { CoinStats } from "./coin-stats";
import { buttonClasses } from "@/components/ui/button";

/**
 * Coin detail page (PDP): identity header, the live price-chart card (the
 * card headline IS the price — live-ticking, with USD + 24h change as the
 * idle subhead), market stats, an «about» blurb, and Buy/Sell CTAs that
 * deep-link into the Trade screen (#7) with this coin preselected.
 */
export function CoinDetailScreen({ detail }: { detail: CoinDetail }) {
  const { coin } = detail;
  const trade = coin.symbol.toLowerCase();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-4">
      {/* Header: identity */}
      <section className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CoinIcon coin={coin} size={52} />
          <div className="flex flex-col">
            <span className="text-[18px] font-extrabold text-ink">
              {coin.name}
            </span>
            <span className="text-[13px] text-muted">{coin.symbol}</span>
          </div>
        </div>
        <FavoriteButton coinId={coin.id} />
      </section>

      <PriceChart coin={coin} series={detail.series} />

      <CoinStats detail={detail} />

      {/* About */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[16px] font-bold text-ink">درباره‌ی {coin.name}</h2>
        <p className="text-[15px] leading-7 text-muted">{detail.description}</p>
      </section>

      {/* CTAs → Trade (#7), coin + side preselected */}
      <div className="flex gap-3">
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
            className: "border border-line",
          })}
        >
          فروش
        </Link>
      </div>
    </div>
  );
}
