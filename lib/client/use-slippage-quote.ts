"use client";

import { useEffect, useState } from "react";
import type { TradeSide } from "@/lib/core/domain/trade/order";
import type { TradeQuote } from "@/lib/core/domain/trade/quote";

/** Quiet period after the last keystroke before the amount is priced. */
const DEBOUNCE_MS = 450;

/**
 * The expected slippage for the order currently on the trade screen, re-priced
 * as the amount settles.
 *
 * Debounced: the keypad changes the amount on every tap, and each quote is a
 * live route plan on the backend — pricing every intermediate number would be
 * both wasteful and unreadable (a figure flickering per digit). Only the amount
 * the user has paused on gets quoted.
 *
 * `null` bps means "nothing to show" — no amount yet, the order isn't valid to
 * price, the request failed, or the backend couldn't price a route. A `0` is a
 * real answer (a firm-price route) and is preserved as such.
 */
export function useSlippageQuote({
  symbol,
  side,
  amountIrt,
  enabled,
}: {
  symbol: string;
  side: TradeSide;
  amountIrt: number;
  /** Skip pricing while the composed order isn't one the backend would accept. */
  enabled: boolean;
}): { bps: number | null; loading: boolean } {
  const [state, setState] = useState<{ key: string; bps: number | null }>({
    key: "",
    bps: null,
  });

  const key = enabled ? `${symbol}:${side}:${Math.round(amountIrt)}` : "";

  useEffect(() => {
    // Nothing to price (no amount, or an order the backend wouldn't accept).
    // No state to clear: the result below is keyed, so a figure from a previous
    // amount is already discarded by the derivation rather than lingering.
    if (!key) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      const url = `/api/trade/quote?symbol=${encodeURIComponent(symbol)}&side=${side}&amountIrt=${Math.round(amountIrt)}`;
      fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("quote failed");
          return (await res.json()) as { quote: TradeQuote };
        })
        .then((body) => setState({ key, bps: body.quote.expectedSlippageBps }))
        .catch(() => {
          if (controller.signal.aborted) return;
          // Display-only: a failed quote hides the figure, it never blocks or
          // interrupts the order the user is composing.
          setState({ key, bps: null });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, symbol, side, amountIrt]);

  // Derived, so a late response for a superseded amount is ignored outright.
  return {
    bps: key !== "" && state.key === key ? state.bps : null,
    loading: key !== "" && state.key !== key,
  };
}
