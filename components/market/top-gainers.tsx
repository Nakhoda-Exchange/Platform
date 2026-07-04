import Link from "next/link";
import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinIcon } from "./coin-icon";
import { SectionHeader } from "./section-header";
import { RocketIcon } from "@/components/ui/icons";
import { formatChangePercent } from "@/lib/utils/money";

/** «بیشترین رشد» — a horizontal strip of the biggest 24h winners. */
export function TopGainers({ coins }: { coins: Coin[] }) {
  if (coins.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="بیشترین رشد" icon={<RocketIcon size={18} />} />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4">
        {coins.map((coin) => (
          <Link
            key={coin.id}
            href={`/market/${coin.symbol.toLowerCase()}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3 py-2"
          >
            <CoinIcon coin={coin} size={24} />
            <span className="text-[13px] font-bold text-ink">
              {coin.symbol}
            </span>
            <span dir="ltr" className="text-[12px] font-bold text-green-700">
              ▲ {formatChangePercent(coin.change24h)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
