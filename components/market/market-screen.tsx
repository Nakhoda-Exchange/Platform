"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
 * Simplified Iran-flag disc (green / white / red bands) for the موجودی تومانی
 * strip. The emblem is dropped — it's unreadable at this size and the tricolor
 * alone reads as «تومان». Pure markup so it renders identically on WebKit and
 * Chromium (no flag-emoji font dependency).
 */
function IranFlag() {
  return (
    <span
      aria-hidden
      className="flex size-7 shrink-0 flex-col overflow-hidden rounded-full ring-1 ring-line/60"
    >
      <span className="flex-1 bg-[#239f40]" />
      <span className="flex-1 bg-white" />
      <span className="flex-1 bg-[#da0000]" />
    </span>
  );
}

/**
 * Market/discover screen. The top shows spendable Toman (or a deposit prompt
 * when there's none). Search is hidden at rest and pins under the header once
 * you scroll past the balance — so the first thing people see is what they can
 * buy with, not a search box. Typing hides the curated sections and shows
 * matches.
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
  const [scrolledPast, setScrolledPast] = useState(false);
  // Real height of the sticky app bar (safe-area inset + bar). Measured, not
  // guessed, so the reveal trigger and the pin position share ONE source and
  // stay correct on notched devices. 72 is just the pre-measure fallback.
  const [headerH, setHeaderH] = useState(72);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searching = query.trim() !== "";

  // Search exists only once the balance has scrolled up behind the header — or
  // while actively searching, so a short result list doesn't make it vanish.
  const showSearch = scrolledPast || searching;

  useEffect(() => {
    // The HeaderBar is the sibling right before the <main> we live in
    // (AppShell renders {header} directly before <main>). Falls back to 72 if
    // that shape ever changes — safe, just a less-precise pin until then.
    const measure = () => {
      const header =
        sentinelRef.current?.closest("main")?.previousElementSibling;
      if (header instanceof HTMLElement) {
        const h = header.getBoundingClientRect().height;
        if (h) setHeaderH(h);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    // The sentinel sits just under the balance. Shrinking the observer root by
    // the header height means "not intersecting" == the balance is gone behind
    // the sticky header, which is exactly when the search should take over.
    const obs = new IntersectionObserver(
      ([entry]) => setScrolledPast(!entry.isIntersecting),
      { rootMargin: `-${Math.round(headerH)}px 0px 0px 0px` },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [headerH]);

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
        // Spendable Toman up top: the flag + «موجودی تومانی» on the right, the
        // amount on the left. The whole strip taps through to deposit.
        <Link
          href="/wallet/deposit"
          aria-label="موجودی تومانی — واریز"
          className="flex items-center justify-between rounded-card bg-surface px-4 py-3.5 transition-colors hover:bg-line"
        >
          <span className="flex items-center gap-2.5">
            <IranFlag />
            <span className="text-[15px] font-bold text-ink">
              موجودی تومانی
            </span>
          </span>
          <span dir="ltr" className="text-[15px] font-extrabold text-ink">
            {formatIrt(availableIrt)}
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

      {/* When this scrolls up behind the header, the search bar takes over. */}
      <div ref={sentinelRef} aria-hidden className="h-0" />

      {showSearch && (
        <div
          // Pins flush under the measured header, in the balance's place.
          className="sticky z-20 -mx-4 bg-paper px-4 py-1"
          style={{ top: headerH }}
        >
          <label className="flex h-[54px] items-center gap-2 rounded-[27px] bg-surface px-[18px] shadow-sm">
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
