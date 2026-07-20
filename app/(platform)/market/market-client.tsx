"use client";

import { useSearchParams } from "next/navigation";
import type { MarketOverview } from "@/lib/core/application/market/use-cases/get-market-overview.use-case";
import { MarketScreen } from "@/components/market/market-screen";
import { LoadError } from "@/components/ui/load-error";
import { useClientData } from "@/lib/client/use-client-data";
import MarketLoading from "./loading";

interface MarketOverviewVM {
  overview: MarketOverview;
  heldIds: string[];
  availableIrt: number;
}

/**
 * Client-rendered market/discover screen. Data is fetched in the browser from
 * `/api/market/overview` (a server-side BFF that forwards the auth token), so
 * this route renders on the client while the fetch stays secure. The search
 * query lives in the URL and is read client-side.
 */
export function MarketClient() {
  const query = useSearchParams().get("q") ?? "";
  const { data, error, loading, reload } = useClientData<MarketOverviewVM>(
    "/api/market/overview",
  );

  if (loading) return <MarketLoading />;
  if (error || !data) {
    return <LoadError message="بارگذاری بازار ناموفق بود." onRetry={reload} />;
  }

  return (
    <MarketScreen
      overview={data.overview}
      heldIds={data.heldIds}
      availableIrt={data.availableIrt}
      initialQuery={query}
    />
  );
}
