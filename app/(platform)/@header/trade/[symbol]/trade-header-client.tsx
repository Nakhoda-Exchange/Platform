"use client";

import Link from "next/link";
import type { TradeContext } from "@/lib/core/domain/trade/order";
import { HeaderBar } from "@/components/layout/header-bar";
import { ArrowRightIcon } from "@/components/ui/icons";
import { CoinIcon } from "@/components/market/coin-icon";
import { useClientData } from "@/lib/client/use-client-data";

interface TradeContextVM {
  context: TradeContext;
}

/**
 * Client-rendered trade slot header: back to the coin's page + coin identity,
 * and nothing else. Fetches the same `/api/trade/[symbol]` BFF the trade page
 * uses. While the coin loads (or can't be resolved) it shows the generic
 * «معامله» bar — placing an order is a focused task, so the bar stays quiet.
 */
export function TradeHeaderClient({ symbol }: { symbol: string }) {
  const { data } = useClientData<TradeContextVM>(
    `/api/trade/${encodeURIComponent(symbol)}`,
  );
  const coin = data?.context.coin ?? null;

  return (
    <HeaderBar
      start={
        <>
          <Link
            href={coin ? `/market/${coin.symbol.toLowerCase()}` : "/market"}
            aria-label="بازگشت"
            className="flex size-11 items-center justify-center rounded-xl text-ink transition-colors hover:bg-surface"
          >
            <ArrowRightIcon size={24} />
          </Link>
          {coin ? (
            <div className="flex items-center gap-2.5">
              <CoinIcon coin={coin} size={36} />
              <div className="flex flex-col">
                <span className="text-[15px] font-extrabold leading-tight text-ink">
                  {coin.name}
                </span>
                <span className="text-[12px] text-muted">{coin.symbol}</span>
              </div>
            </div>
          ) : (
            <h1 className="text-[18px] font-extrabold text-ink">معامله</h1>
          )}
        </>
      }
      end={null}
    />
  );
}
