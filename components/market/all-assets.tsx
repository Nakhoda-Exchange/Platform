"use client";

import { useMemo, useState } from "react";
import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinRow } from "./coin-row";
import { cn } from "@/lib/utils/cn";
import { replaceUrlParam } from "@/lib/utils/url-param";

// «همه» already lists coins in market-cap order, so a separate «ارزش بازار»
// filter would be identical — dropped.
type FilterKey = "all" | "gainers" | "losers";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "gainers", label: "بیشترین رشد" },
  { key: "losers", label: "بیشترین ضرر" },
];

/**
 * «همه ارزها» — the browsable coin list. Filters live here (they scope this
 * list), not at the top of the screen.
 */
export function AllAssets({
  coins,
  heldSymbols,
  title = "همه ارزها",
  showFilters = true,
  initialFilter,
  urlSync = false,
}: {
  coins: Coin[];
  heldSymbols: string[];
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

  const sorted = useMemo(() => {
    const list = [...coins];
    if (filter === "gainers") list.sort((a, b) => b.change24h - a.change24h);
    else if (filter === "losers")
      list.sort((a, b) => a.change24h - b.change24h);
    return list;
  }, [coins, filter]);

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
          رمزارزی پیدا نشد.
        </p>
      ) : (
        <ul className="-mx-4 flex flex-col divide-y divide-line">
          {sorted.map((coin) => (
            <li key={coin.id}>
              <CoinRow
                coin={coin}
                canSell={heldSymbols.includes(coin.symbol.toUpperCase())}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
