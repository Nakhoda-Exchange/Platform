import Link from "next/link";
import type { Holding } from "@/lib/core/domain/portfolio/portfolio";
import { CoinIcon } from "@/components/market/coin-icon";
import { formatCoinAmount, formatIrtShort } from "@/lib/utils/money";

/**
 * One holding row. Right (RTL start): the coin's identity — logo, Persian
 * name, symbol. Left: the balance — how many units are held and what they
 * are worth in Toman. The 24h change lives on the coin's detail page, not
 * here — this list answers «چقدر دارم؟», nothing else. Tapping opens the PDP.
 */
export function HoldingListItem({ holding }: { holding: Holding }) {
  const { coin, amount, valueIrt } = holding;
  return (
    <Link
      href={`/market/${coin.symbol.toLowerCase()}`}
      className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-surface"
    >
      {/* Identity */}
      <div className="flex items-center gap-3">
        <CoinIcon coin={coin} size={42} />
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-ink">{coin.name}</span>
          <span dir="ltr" className="text-[12px] text-muted">
            {coin.symbol}
          </span>
        </div>
      </div>

      {/* Balance: units held + their Toman value */}
      <div className="flex flex-col items-start gap-0.5" dir="ltr">
        <span className="text-[14px] font-bold text-ink">
          {formatIrtShort(valueIrt)}
        </span>
        <span className="text-[13px] text-muted">
          {coin.symbol} {formatCoinAmount(amount)}
        </span>
      </div>
    </Link>
  );
}
