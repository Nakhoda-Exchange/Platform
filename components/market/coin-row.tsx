import Link from "next/link";
import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinIcon } from "./coin-icon";
import { formatChangePercent, formatIrtShort } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/**
 * A market list row. RTL: coin logo + name/subtitle on the right, price + 24h
 * change on the left. Tapping opens the coin detail page. `subtitle` is the
 * symbol (All assets) or the market cap (Trending).
 */
export function CoinRow({ coin, subtitle }: { coin: Coin; subtitle: string }) {
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
          <span className="text-[12px] text-muted">{subtitle}</span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-0.5" dir="ltr">
        <span className="text-[14px] font-bold text-ink">
          {formatIrtShort(coin.priceIrt)}
        </span>
        <span
          aria-label={`${up ? "افزایش" : "کاهش"} ${formatChangePercent(coin.change24h)}`}
          className={cn(
            "text-[13px] font-bold",
            up ? "text-gain" : "text-loss",
          )}
        >
          {up ? "▲" : "▼"} {formatChangePercent(coin.change24h)}
        </span>
      </div>
    </Link>
  );
}
