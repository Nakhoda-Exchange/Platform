import Link from "next/link";
import type { Coin } from "@/lib/core/domain/market/coin";
import { HeaderBar } from "@/components/layout/header-bar";
import { CoinIcon } from "./coin-icon";
import { FavoriteButton } from "./favorite-button";
import { ChevronRightIcon, ClockIcon } from "@/components/ui/icons";

/**
 * The coin detail page's app bar: back + the coin's identity (icon, Persian
 * name, symbol) on the start side, favorite and trade-history actions on the
 * end side — replacing the default notification/support actions.
 */
export function CoinPageHeader({ coin }: { coin: Coin }) {
  return (
    <HeaderBar
      start={
        <>
          <Link
            href="/market"
            aria-label="بازگشت"
            className="flex size-11 items-center justify-center rounded-xl text-ink transition-colors hover:bg-surface"
          >
            <ChevronRightIcon size={24} />
          </Link>
          <div className="flex items-center gap-2.5">
            <CoinIcon coin={coin} size={36} />
            <div className="flex flex-col">
              <span className="text-[15px] font-extrabold leading-tight text-ink">
                {coin.name}
              </span>
              <span className="text-[12px] text-muted">{coin.symbol}</span>
            </div>
          </div>
        </>
      }
      end={
        <>
          <FavoriteButton coinId={coin.id} />
          <Link
            href="/wallet/history"
            aria-label="تاریخچه تراکنش‌ها"
            className="flex size-11 items-center justify-center rounded-xl bg-surface text-muted transition-colors hover:bg-line"
          >
            <ClockIcon size={20} />
          </Link>
        </>
      }
    />
  );
}
