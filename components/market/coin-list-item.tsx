import Link from "next/link";
import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinBadge } from "./coin-badge";
import { ChangePill } from "./change-pill";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { formatIrt, formatUsd } from "@/lib/utils/money";

/**
 * One market-list row (PLP item). Tapping it opens the coin detail page (PDP).
 * RTL: coin identity on the right, price/change on the left.
 */
export function CoinListItem({ coin }: { coin: Coin }) {
  return (
    <Link
      href={`/market/${coin.symbol.toLowerCase()}`}
      className="flex items-center justify-between gap-3 border-b border-line py-3 transition-colors last:border-0 hover:bg-surface"
    >
      <div className="flex items-center gap-3">
        <CoinBadge symbol={coin.symbol} />
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-ink">{coin.name}</span>
          <span className="text-[12px] text-muted">{coin.symbol}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-[14px] font-bold text-ink">
            {formatIrt(coin.priceIrt)}
          </span>
          <span dir="ltr" className="text-[12px] text-muted">
            {formatUsd(coin.priceUsd)}
          </span>
        </div>
        <ChangePill change={coin.change24h} />
        <ChevronLeftIcon size={18} className="shrink-0 text-placeholder" />
      </div>
    </Link>
  );
}
