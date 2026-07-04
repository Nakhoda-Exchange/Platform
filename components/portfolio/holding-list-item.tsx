import Link from "next/link";
import type { Holding } from "@/lib/core/domain/portfolio/portfolio";
import { CoinIcon } from "@/components/market/coin-icon";
import {
  formatChangePercent,
  formatCoinAmount,
  formatIrtShort,
} from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/**
 * One holding row: coin logo + name + amount held on the right; Toman value +
 * 24h change on the left. Tapping opens the coin detail page.
 */
export function HoldingListItem({ holding }: { holding: Holding }) {
  const { coin, amount, valueIrt } = holding;
  const up = coin.change24h >= 0;
  return (
    <Link
      href={`/market/${coin.symbol.toLowerCase()}`}
      className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-surface"
    >
      <div className="flex items-center gap-3">
        <CoinIcon coin={coin} size={42} />
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-ink">{coin.name}</span>
          <span dir="ltr" className="text-[12px] text-muted">
            {formatCoinAmount(amount)} {coin.symbol}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-0.5" dir="ltr">
        <span className="text-[14px] font-bold text-ink">
          {formatIrtShort(valueIrt)}
        </span>
        <span
          aria-label={`${up ? "افزایش" : "کاهش"} ${formatChangePercent(coin.change24h)}`}
          className={cn(
            "text-[13px] font-bold",
            up ? "text-green-700" : "text-red-700",
          )}
        >
          {up ? "▲" : "▼"} {formatChangePercent(coin.change24h)}
        </span>
      </div>
    </Link>
  );
}
