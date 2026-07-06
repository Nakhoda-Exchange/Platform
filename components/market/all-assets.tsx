"use client";

import { useEffect, useMemo, useState } from "react";
import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinRow } from "./coin-row";
import { cn } from "@/lib/utils/cn";
import { replaceUrlParam } from "@/lib/utils/url-param";
import { FAVORITES_EVENT, getFavorites } from "@/lib/utils/favorites";

type FilterKey = "all" | "fav" | "gainers" | "losers" | "mcap";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "fav", label: "علاقه‌مندی‌ها" },
  { key: "gainers", label: "بیشترین رشد" },
  { key: "losers", label: "بیشترین ضرر" },
  { key: "mcap", label: "ارزش بازار" },
];

/**
 * «همه ارزها» — the browsable coin list. Filters live here (they scope this
 * list), not at the top of the screen.
 */
export function AllAssets({
  coins,
  heldIds,
  title = "همه ارزها",
  showFilters = true,
  initialFilter,
  urlSync = false,
}: {
  coins: Coin[];
  heldIds: string[];
  title?: string;
  showFilters?: boolean;
  initialFilter?: string;
  urlSync?: boolean;
}) {
  const [filter, setFilter] = useState<FilterKey>(
    FILTERS.some((f) => f.key === initialFilter)
      ? (initialFilter as FilterKey)
      : "all",
  );

  // Watchlist lives in localStorage (per-device until sessions, like the
  // announcements read-state); the event keeps this list live when a star
  // toggles elsewhere.
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  useEffect(() => {
    const read = () => setFavorites(getFavorites());
    read();
    window.addEventListener(FAVORITES_EVENT, read);
    return () => window.removeEventListener(FAVORITES_EVENT, read);
  }, []);

  const sorted = useMemo(() => {
    let list = [...coins];
    if (filter === "fav") list = list.filter((c) => favorites.has(c.id));
    if (filter === "gainers") list.sort((a, b) => b.change24h - a.change24h);
    else if (filter === "losers")
      list.sort((a, b) => a.change24h - b.change24h);
    else if (filter === "mcap") list.sort((a, b) => b.marketCap - a.marketCap);
    return list;
  }, [coins, filter, favorites]);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[17px] font-bold text-ink">{title}</h2>

      {showFilters ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setFilter(f.key);
                if (urlSync)
                  replaceUrlParam("f", f.key === "all" ? null : f.key);
              }}
              aria-pressed={f.key === filter}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-[13px] transition-colors",
                f.key === filter
                  ? "bg-brand font-bold text-white"
                  : "bg-surface font-medium text-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}

      {sorted.length === 0 ? (
        <p className="py-12 text-center text-[15px] text-muted">
          {filter === "fav"
            ? "هنوز رمزارزی را ستاره نکرده‌اید. از صفحه هر رمزارز، ستاره را بزنید."
            : "رمزارزی پیدا نشد."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {sorted.map((coin) => (
            <li key={coin.id}>
              <CoinRow coin={coin} canSell={heldIds.includes(coin.id)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
