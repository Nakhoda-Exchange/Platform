"use client";

import { useSearchParams } from "next/navigation";
import type { TradeContext } from "@/lib/core/domain/trade/order";
import { TradeScreen } from "@/components/trade/trade-screen";
import { LoadError } from "@/components/ui/load-error";
import { useClientData } from "@/lib/client/use-client-data";
import TradeLoading from "./loading";

interface TradeContextVM {
  context: TradeContext;
}

/**
 * Client-rendered trade (buy/sell) screen. Data is fetched in the browser from
 * `/api/trade/[symbol]` (server-side BFF). The buy/sell side is read from the
 * URL client-side; order placement still goes through the `placeTradeOrder`
 * server action inside {@link TradeScreen}.
 */
export function TradeClient({ symbol }: { symbol: string }) {
  const side = useSearchParams().get("side");
  const { data, error, loading, reload } = useClientData<TradeContextVM>(
    `/api/trade/${encodeURIComponent(symbol)}`,
  );

  if (loading) return <TradeLoading />;
  if (error || !data) {
    return (
      <LoadError
        message="بارگذاری اطلاعات معامله ناموفق بود."
        action={{ label: "بازگشت به بازار", href: "/market" }}
        onRetry={reload}
      />
    );
  }

  return (
    <TradeScreen
      context={data.context}
      initialSide={side === "sell" ? "sell" : "buy"}
    />
  );
}
