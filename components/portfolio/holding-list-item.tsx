"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Holding } from "@/lib/core/domain/portfolio/portfolio";
import { CoinIcon } from "@/components/market/coin-icon";
import { SwipeActions } from "@/components/ui/swipe-actions";
import { CoinsIcon, WalletIcon } from "@/components/ui/icons";
import { formatCoinAmount, formatIrtShort } from "@/lib/utils/money";

/**
 * One holding row. Right (RTL start): the coin's identity — logo, Persian
 * name, symbol. Left: how many units are held and their Toman worth. Tapping
 * opens the PDP; swipe LEFT to buy more, RIGHT to sell (like the market list).
 */
export function HoldingListItem({ holding }: { holding: Holding }) {
  const router = useRouter();
  const { coin, amount, valueIrt } = holding;
  const sym = coin.symbol.toLowerCase();

  return (
    <SwipeActions
      left={{
        label: "خرید",
        Icon: CoinsIcon,
        tone: "gain",
        onCommit: () => router.push(`/trade/${sym}?side=buy`),
      }}
      right={{
        label: "فروش",
        Icon: WalletIcon,
        tone: "loss",
        onCommit: () => router.push(`/trade/${sym}?side=sell`),
      }}
    >
      <Link
        href={`/market/${sym}`}
        draggable={false}
        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface"
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
    </SwipeActions>
  );
}
