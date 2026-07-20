"use client";

import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import {
  CoinDetailScreen,
  type CoinHolding,
} from "@/components/market/coin-detail-screen";
import { LoadError } from "@/components/ui/load-error";
import { useClientData } from "@/lib/client/use-client-data";
import CoinDetailLoading from "./loading";

interface CoinDetailVM {
  detail: CoinDetail;
  holding: CoinHolding | null;
}

/**
 * Client-rendered coin detail (PDP). Data is fetched in the browser from
 * `/api/market/[symbol]` (server-side BFF). The PDP no-chart resilience lives
 * in {@link CoinDetailScreen} and is untouched.
 */
export function CoinDetailClient({ symbol }: { symbol: string }) {
  const { data, error, loading, reload } = useClientData<CoinDetailVM>(
    `/api/market/${encodeURIComponent(symbol)}`,
  );

  if (loading) return <CoinDetailLoading />;
  if (error || !data) {
    return (
      <LoadError
        message="بارگذاری اطلاعات رمزارز ناموفق بود."
        action={{ label: "بازگشت به بازار", href: "/market" }}
        onRetry={reload}
      />
    );
  }

  return (
    <CoinDetailScreen
      detail={data.detail}
      holding={data.holding ?? undefined}
    />
  );
}
