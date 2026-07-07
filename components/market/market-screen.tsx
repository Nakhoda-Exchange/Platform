"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MarketOverview } from "@/lib/core/application/market/use-cases/get-market-overview.use-case";
import { SearchIcon, WalletIcon, ChevronLeftIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { toEnglishDigits } from "@/lib/utils/digits";
import { formatIrt } from "@/lib/utils/money";
import { replaceUrlParam } from "@/lib/utils/url-param";
import { TopGainers } from "./top-gainers";
import { WatchlistSection } from "./watchlist-section";
import { TrendingList } from "./trending-list";
import { NewCoins } from "./new-coins";
import { AllAssets } from "./all-assets";

/**
 * Market/discover screen. Discovery-first: search → gainers → trending → new →
 * all-assets. Typing in search hides the curated sections and shows matches.
 * When there's spendable Toman, a strip up top shows what's on hand to buy with.
 */
export function MarketScreen({
  overview,
  heldIds,
  availableIrt = 0,
  initialQuery = "",
  initialFilter,
}: {
  overview: MarketOverview;
  heldIds: string[];
  availableIrt?: number;
  initialQuery?: string;
  initialFilter?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const searching = query.trim() !== "";

  const clearSearch = () => {
    setQuery("");
    replaceUrlParam("q", null);
  };

  const results = useMemo(() => {
    if (!searching) return overview.all;
    const q = toEnglishDigits(query).trim().toLowerCase();
    const nameQuery = query.trim();
    return overview.all.filter(
      (c) => c.name.includes(nameQuery) || c.symbol.toLowerCase().includes(q),
    );
  }, [query, searching, overview.all]);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-6 pt-4">
      <label className="flex h-[54px] items-center gap-2 rounded-[27px] bg-surface px-[18px]">
        <SearchIcon size={20} className="shrink-0 text-placeholder" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            replaceUrlParam("q", e.target.value.trim() || null);
          }}
          placeholder="جستجوی رمزارز…"
          aria-label="جستجوی رمزارز"
          className="w-full bg-transparent text-right text-[16px] text-ink outline-none placeholder:text-placeholder"
        />
      </label>

      {availableIrt > 0 ? (
        <Link
          href="/wallet/deposit"
          className="flex items-center justify-between rounded-card bg-surface px-4 py-3 transition-colors hover:bg-line"
        >
          <span className="flex items-center gap-2 text-[14px]">
            <span className="text-muted">موجودی تومانی</span>
            <span dir="ltr" className="font-extrabold text-ink">
              {formatIrt(availableIrt)}
            </span>
          </span>
          <span className="rounded-full bg-brand/10 px-3 py-1.5 text-[13px] font-bold text-brand">
            واریز
          </span>
        </Link>
      ) : (
        // No spendable Toman — you can't buy anything, so lead with a bold
        // deposit card instead of a balance strip.
        <Link
          href="/wallet/deposit"
          className="flex items-center gap-4 rounded-card bg-brand p-5 text-white transition-opacity hover:opacity-95"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15">
            <WalletIcon size={26} />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[16px] font-extrabold">
              برای خرید، تومان واریز کن
            </span>
            <span className="text-[13px] leading-[1.7] text-white/80">
              با واریز تومان می‌تونی اولین رمزارزت را بخری.
            </span>
          </span>
          <ChevronLeftIcon size={22} className="shrink-0 text-white/80" />
        </Link>
      )}

      {searching ? (
        results.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-[15px] leading-[1.9] text-muted">
              برای «{query.trim()}» رمزارزی پیدا نشد. املای نام یا نماد را بررسی
              کنید.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={clearSearch}
            >
              پاک کردن جستجو
            </Button>
          </div>
        ) : (
          <AllAssets
            coins={results}
            heldIds={heldIds}
            title="نتایج جستجو"
            showFilters={false}
          />
        )
      ) : (
        <>
          <WatchlistSection coins={overview.all} heldIds={heldIds} />
          <TopGainers coins={overview.topGainers} />
          <TrendingList coins={overview.trending} heldIds={heldIds} />
          <NewCoins coins={overview.newCoins} />
          <AllAssets
            coins={overview.all}
            heldIds={heldIds}
            initialFilter={initialFilter}
            urlSync
          />
        </>
      )}
    </div>
  );
}
