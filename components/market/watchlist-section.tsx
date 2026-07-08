"use client";

import { useEffect, useState } from "react";
import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinRow } from "./coin-row";
import { SectionHeader } from "./section-header";
import { StarIcon } from "@/components/ui/icons";
import { FAVORITES_EVENT, getFavorites } from "@/lib/utils/favorites";

/**
 * «علاقه‌مندی‌ها» — the user's watchlist, shown right after «بیشترین رشد»
 * (the place people check their coins daily; the chip in «همه ارزها» remains
 * as a filter). Renders nothing until at least one coin is starred, so new
 * users see the curated discovery sections untouched.
 */
export function WatchlistSection({
  coins,
  heldIds,
}: {
  coins: Coin[];
  heldIds: string[];
}) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const read = () => setFavorites(getFavorites());
    read();
    window.addEventListener(FAVORITES_EVENT, read);
    return () => window.removeEventListener(FAVORITES_EVENT, read);
  }, []);

  const watchlist = coins.filter((c) => favorites.has(c.id));
  if (watchlist.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <SectionHeader title="علاقه‌مندی‌ها" icon={<StarIcon size={18} />} />
      <ul className="-mx-4 flex flex-col divide-y divide-line">
        {watchlist.map((coin) => (
          <li key={coin.id}>
            <CoinRow coin={coin} canSell={heldIds.includes(coin.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
