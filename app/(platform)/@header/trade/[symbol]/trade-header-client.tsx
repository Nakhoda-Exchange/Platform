"use client";

import Link from "next/link";
import { coinDisplaySymbol } from "@/lib/core/domain/market/coin";
import type { TradeContext } from "@/lib/core/domain/trade/order";
import { HeaderBar } from "@/components/layout/header-bar";
import { ArrowRightIcon, SlidersIcon } from "@/components/ui/icons";
import { CoinIcon } from "@/components/market/coin-icon";
import { useClientData } from "@/lib/client/use-client-data";
import { useState } from "react";
import { TradeSettingsSheet } from "@/components/trade/trade-settings-sheet";

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
  const [settingsOpen, setSettingsOpen] = useState(false);

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
                <span className="text-[12px] text-muted">
                  {coinDisplaySymbol(coin)}
                </span>
              </div>
            </div>
          ) : (
            <h1 className="text-[18px] font-extrabold text-ink">معامله</h1>
          )}
        </>
      }
      end={
        <>
          {/* `end` is the LEFT side in RTL. Trade preferences belong here rather
              than in the account area: slippage is a decision made about THIS
              order, at the moment of placing it. */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="تنظیمات معامله"
            className="flex size-11 items-center justify-center rounded-xl text-ink transition-colors hover:bg-surface"
          >
            <SlidersIcon size={22} />
          </button>
          <TradeSettingsSheet
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
        </>
      }
    />
  );
}
