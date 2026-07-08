import Link from "next/link";
import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinIcon } from "./coin-icon";
import { SectionHeader } from "./section-header";
import { RocketIcon } from "@/components/ui/icons";
import { Sparkline } from "./sparkline";
import { formatChangePercent, formatIrtShort } from "@/lib/utils/money";

/**
 * «بیشترین رشد» — a horizontal spotlight of the biggest 24h winners, each a
 * card with its price, a mini sparkline, and the gain. Reads as momentum at a
 * glance, not a flat row.
 */
export function TopGainers({ coins }: { coins: Coin[] }) {
  if (coins.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="بیشترین رشد" icon={<RocketIcon size={18} />} />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {coins.map((coin) => (
          <Link
            key={coin.id}
            href={`/market/${coin.symbol.toLowerCase()}`}
            className="flex w-[150px] shrink-0 flex-col gap-2.5 rounded-card bg-surface p-3.5 transition-colors hover:bg-line"
          >
            <span className="flex items-center gap-2">
              <CoinIcon coin={coin} size={30} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13px] font-bold text-ink">
                  {coin.name}
                </span>
                <span dir="ltr" className="text-[11px] text-muted">
                  {coin.symbol}
                </span>
              </span>
            </span>

            <Sparkline symbol={coin.symbol} up width={122} height={34} />

            <span className="flex items-center justify-between gap-1">
              <span
                dir="ltr"
                className="text-[14px] font-extrabold tabular-nums text-ink"
              >
                {formatIrtShort(coin.priceIrt)}
              </span>
              <span
                dir="ltr"
                aria-label={`رشد ${formatChangePercent(coin.change24h)} در ۲۴ ساعت`}
                className="flex items-center gap-0.5 rounded-full bg-gain-soft px-2 py-0.5 text-[11px] font-extrabold text-gain"
              >
                ▲ {formatChangePercent(coin.change24h)}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
