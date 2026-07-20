"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { MarketOverview } from "@/lib/core/application/market/use-cases/get-market-overview.use-case";
import { SearchIcon, WalletIcon, ChevronLeftIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { toEnglishDigits } from "@/lib/utils/digits";
import { replaceUrlParam } from "@/lib/utils/url-param";
import { CashListItem } from "@/components/portfolio/cash-list-item";
import { TopGainers } from "./top-gainers";
import { WatchlistSection } from "./watchlist-section";
import { TrendingList } from "./trending-list";
import { AllAssets } from "./all-assets";

/**
 * Market/discover screen. The top shows spendable Toman (or a deposit prompt
 * when there's none), then a search box that's always visible and pins under
 * the header as you scroll. Typing hides the curated sections and shows
 * matches.
 */
export function MarketScreen({
  overview,
  heldSymbols,
  availableIrt = 0,
  initialQuery = "",
}: {
  overview: MarketOverview;
  heldSymbols: string[];
  availableIrt?: number;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  // Real height of the sticky app bar (safe-area inset + bar), measured so the
  // always-visible search pins flush under it on notched devices. 72 is the
  // pre-measure fallback.
  const [headerH, setHeaderH] = useState(72);
  const searchRef = useRef<HTMLDivElement>(null);
  const searching = query.trim() !== "";

  useEffect(() => {
    // The HeaderBar is the sibling right before the <main> we live in
    // (AppShell renders {header} directly before <main>). Falls back to 72 if
    // that shape ever changes — safe, just a less-precise pin until then.
    const measure = () => {
      const header = searchRef.current?.closest("main")?.previousElementSibling;
      if (header instanceof HTMLElement) {
        const h = header.getBoundingClientRect().height;
        if (h) setHeaderH(h);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

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
      {availableIrt > 0 ? (
        // Spendable Toman up top — the same card as the wallet «دارایی‌های من»
        // Toman row, in a card container so it stands out at the page top.
        <CashListItem
          availableIrt={availableIrt}
          className="rounded-card bg-surface hover:bg-line"
        />
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

      {/* Always visible; pins flush under the header as you scroll. */}
      <div
        ref={searchRef}
        className="sticky z-20 -mx-4 bg-paper px-4 py-1"
        style={{ top: headerH }}
      >
        <label className="flex h-[54px] items-center gap-2 rounded-[27px] border border-line bg-surface px-[18px] shadow-sm">
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
      </div>

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
            heldSymbols={heldSymbols}
            title="نتایج جستجو"
            showFilters={false}
          />
        )
      ) : (
        <>
          <TopGainers coins={overview.topGainers} />
          <WatchlistSection coins={overview.all} heldSymbols={heldSymbols} />
          <TrendingList coins={overview.trending} heldSymbols={heldSymbols} />
        </>
      )}
    </div>
  );
}
