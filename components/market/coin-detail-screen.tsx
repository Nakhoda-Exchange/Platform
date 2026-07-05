import Link from "next/link";
import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { CoinIcon } from "./coin-icon";
import { PriceChart } from "./price-chart";
import { CoinStats } from "./coin-stats";
import { buttonClasses } from "@/components/ui/button";
import { formatChangePercent, formatIrt, formatUsd } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/**
 * Coin detail page (PDP): header (icon/name/price/change), price chart with a
 * range switcher, market stats, an «about» blurb, and Buy/Sell CTAs that
 * deep-link into the Trade screen (#7) with this coin preselected.
 */
export function CoinDetailScreen({ detail }: { detail: CoinDetail }) {
  const { coin } = detail;
  const up = coin.change24h >= 0;
  const trade = coin.symbol.toLowerCase();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-4">
      {/* Header: identity + current price */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <CoinIcon coin={coin} size={52} />
          <div className="flex flex-col">
            <span className="text-[18px] font-extrabold text-ink">
              {coin.name}
            </span>
            <span className="text-[13px] text-muted">{coin.symbol}</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[26px] font-extrabold text-ink" dir="ltr">
              {formatIrt(coin.priceIrt)}
            </span>
            <span className="text-[14px] text-muted" dir="ltr">
              {formatUsd(coin.priceUsd)}
            </span>
          </div>
          <span
            dir="ltr"
            aria-label={`${up ? "افزایش" : "کاهش"} ${formatChangePercent(coin.change24h)} در ۲۴ ساعت`}
            className={cn(
              "text-[15px] font-bold",
              up ? "text-gain" : "text-loss",
            )}
          >
            {up ? "▲" : "▼"} {formatChangePercent(coin.change24h)}
          </span>
        </div>
      </section>

      <PriceChart series={detail.series} />

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
