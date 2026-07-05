"use client";

import { useEffect, useState } from "react";
import { StarIcon } from "@/components/ui/icons";
import { isFavorite, toggleFavorite } from "@/lib/utils/favorites";
import { cn } from "@/lib/utils/cn";

/** Star toggle on the coin detail header — adds the coin to the watchlist. */
export function FavoriteButton({ coinId }: { coinId: string }) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only read
    setFavorite(isFavorite(coinId));
  }, [coinId]);

  return (
    <button
      type="button"
      aria-pressed={favorite}
      aria-label={favorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      onClick={() => setFavorite(toggleFavorite(coinId))}
      className={cn(
        "flex size-11 items-center justify-center rounded-xl transition-colors",
        favorite
          ? "bg-brand/10 text-brand"
          : "bg-surface text-placeholder hover:text-muted",
      )}
    >
      <StarIcon size={20} fill={favorite ? "currentColor" : "none"} />
    </button>
  );
}
