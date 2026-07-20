"use client";

import Link from "next/link";
import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { CoinPageHeader } from "@/components/market/coin-page-header";
import { HeaderBar } from "@/components/layout/header-bar";
import { ArrowRightIcon } from "@/components/ui/icons";
import { useClientData } from "@/lib/client/use-client-data";

interface CoinDetailVM {
  detail: CoinDetail;
}

/** Plain back bar shown while the coin loads or when it can't be resolved —
 *  the page itself renders the matching 404/error state. */
function FallbackBar() {
  return (
    <HeaderBar
      start={
        <>
          <Link
            href="/market"
            aria-label="بازگشت"
            className="flex size-11 items-center justify-center rounded-xl text-ink transition-colors hover:bg-surface"
          >
            <ArrowRightIcon size={24} />
          </Link>
          <h1 className="text-[18px] font-extrabold text-ink">جزئیات رمزارز</h1>
        </>
      }
      end={null}
    />
  );
}

/**
 * Client-rendered coin-detail slot header: coin identity + favorite/history.
 * Fetches the same `/api/market/[symbol]` BFF the detail page uses, so the
 * header renders on the client alongside the page.
 */
export function CoinHeaderClient({ symbol }: { symbol: string }) {
  const { data, error, loading } = useClientData<CoinDetailVM>(
    `/api/market/${encodeURIComponent(symbol)}`,
  );

  if (loading || error || !data) return <FallbackBar />;
  return <CoinPageHeader coin={data.detail.coin} />;
}
