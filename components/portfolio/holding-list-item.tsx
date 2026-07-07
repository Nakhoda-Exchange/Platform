import Link from "next/link";
import type { Holding } from "@/lib/core/domain/portfolio/portfolio";
import { CoinIcon } from "@/components/market/coin-icon";
import { buttonClasses } from "@/components/ui/button";
import { formatCoinAmount, formatIrtShort } from "@/lib/utils/money";

/**
 * One holding row. Right (RTL start): the coin's identity — logo, Persian
 * name, symbol. Middle: the balance — how many units are held and what they
 * are worth in Toman. Left: a direct «فروش» button, so selling a coin you
 * hold is one tap (not wallet → detail → sell). Tapping the identity/balance
 * opens the PDP.
 */
export function HoldingListItem({ holding }: { holding: Holding }) {
  const { coin, amount, valueIrt } = holding;
  const symbol = coin.symbol.toLowerCase();
  return (
    <div className="flex items-center gap-3 py-3">
      <Link
        href={`/market/${symbol}`}
        className="flex flex-1 items-center justify-between gap-3 rounded-[14px] transition-colors hover:bg-surface"
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

      <Link
        href={`/trade/${symbol}?side=sell`}
        aria-label={`فروش ${coin.name}`}
        className={buttonClasses({
          variant: "ghost",
          size: "sm",
          className: "shrink-0 border border-line",
        })}
      >
        فروش
      </Link>
    </div>
  );
}
