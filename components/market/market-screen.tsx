"use client";

import { useMemo, useState } from "react";
import type { MarketOverview } from "@/lib/core/application/market/use-cases/get-market-overview.use-case";
import { SearchIcon } from "@/components/ui/icons";
import { toEnglishDigits } from "@/lib/utils/digits";
import { replaceUrlParam } from "@/lib/utils/url-param";
import { TopGainers } from "./top-gainers";
import { WatchlistSection } from "./watchlist-section";
import { TrendingList } from "./trending-list";
import { NewCoins } from "./new-coins";
import { AllAssets } from "./all-assets";

/**
 * Market/discover screen. Discovery-first: search → gainers → trending → new →
 * all-assets. Typing in search hides the curated sections and shows matches.
 * (Portfolio balance lives on the Holdings tab, not here.)
 */
export function MarketScreen({
  overview,
  heldIds,
  initialQuery = "",
  initialFilter,
}: {
  overview: MarketOverview;
  heldIds: string[];
  initialQuery?: string;
  initialFilter?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const searching = query.trim() !== "";

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

      {searching ? (
        <AllAssets
          coins={results}
          heldIds={heldIds}
          title="نتایج جستجو"
          showFilters={false}
        />
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
