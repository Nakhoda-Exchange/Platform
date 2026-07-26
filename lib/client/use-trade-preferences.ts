"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_TRADE_PREFERENCES,
  type TradePreferences,
} from "@/lib/core/domain/trade/preferences";

/**
 * The signed-in user's trade preferences, for the screens that act on them.
 *
 * Falls back to the defaults while loading and on any failure — never blocks or
 * errors the trade screen over a preference. The consequence of the fallback is
 * mild and correct: the confirm window is the standard one, and no slippage
 * override is sent, so the backend resolves the coin's own tolerance.
 */
export function useTradePreferences(): TradePreferences {
  const [prefs, setPrefs] = useState<TradePreferences>(
    DEFAULT_TRADE_PREFERENCES,
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/trade-preferences", {
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("load failed");
        return (await res.json()) as { preferences: TradePreferences };
      })
      .then((body) => {
        if (!cancelled) setPrefs(body.preferences);
      })
      .catch(() => {
        // Keep the defaults; a preference is never worth an error state here.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return prefs;
}
