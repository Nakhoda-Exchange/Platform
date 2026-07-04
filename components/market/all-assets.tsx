"use client";

import { useMemo, useState } from "react";
import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinRow } from "./coin-row";
import { cn } from "@/lib/utils/cn";

type FilterKey = "all" | "gainers" | "losers" | "mcap";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "همه" },
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
  title = "همه ارزها",
  showFilters = true,
}: {
  coins: Coin[];
  title?: string;
  showFilters?: boolean;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const sorted = useMemo(() => {
    const list = [...coins];
    if (filter === "gainers") list.sort((a, b) => b.change24h - a.change24h);
    else if (filter === "losers")
      list.sort((a, b) => a.change24h - b.change24h);
    else if (filter === "mcap") list.sort((a, b) => b.marketCap - a.marketCap);
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
              onClick={() => setFilter(f.key)}
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
        <ul className="flex flex-col divide-y divide-line">
          {sorted.map((coin) => (
            <li key={coin.id}>
              <CoinRow coin={coin} subtitle={coin.symbol} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
