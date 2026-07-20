"use client";

import { useEffect, useRef, useState } from "react";
import type { ConnectionStatus } from "@/lib/core/application/realtime/ports/realtime-source.port";
import type { PriceTick, TradeUpdate } from "@/lib/core/domain/realtime/events";
import { getRealtimeSource } from "@/lib/realtime/realtime-source.instance";

/**
 * Live prices keyed by coin id, kept current from the realtime source. Opens
 * the connection on mount and releases it on unmount (the source closes when no
 * hook is left listening). Also returns the connection status for a live/offline
 * affordance.
 */
export function useLivePrices(): {
  prices: Record<string, PriceTick>;
  status: ConnectionStatus;
} {
  const [prices, setPrices] = useState<Record<string, PriceTick>>({});
  const [status, setStatus] = useState<ConnectionStatus>(
    () => getRealtimeSource().status,
  );

  useEffect(() => {
    const source = getRealtimeSource();
    const offStatus = source.onStatus(setStatus);
    const offEvents = source.subscribe(["prices"], (event) => {
      if (event.type === "price") {
        setPrices((prev) => ({ ...prev, [event.coinId]: event }));
      }
    });
    return () => {
      offEvents();
      offStatus();
    };
  }, []);

  return { prices, status };
}

/**
 * The latest live tick for ONE coin, or `null` until its first tick. Unlike
 * {@link useLivePrices} — which re-renders on *every* coin's tick because it
 * holds the whole map — this re-renders its caller only when THIS coin's price
 * changes. So a long market list updates and flashes row-by-row instead of
 * re-rendering every row on each tick. Shares the one singleton connection like
 * every other realtime hook (`getRealtimeSource`).
 */
export function useLivePrice(coinId: string): PriceTick | null {
  const [tick, setTick] = useState<PriceTick | null>(null);
  useEffect(() => {
    const source = getRealtimeSource();
    return source.subscribe(["prices"], (event) => {
      if (event.type === "price" && event.coinId === coinId) setTick(event);
    });
  }, [coinId]);
  return tick;
}

/**
 * Detects when `value` changes to a new number and reports the direction of the
 * change, for a brief flash affordance. Returns `null` on the first render and
 * whenever the value is unchanged (so nothing flashes on mount); on a real
 * change it returns the direction plus a monotonic `id` that differs every time
 * — use that `id` as the React `key` on the flashing element so its one-shot CSS
 * animation replays on each change. Motion itself is suppressed for
 * `prefers-reduced-motion` users by the animation's own `motion-reduce` CSS, so
 * the number still updates but nothing moves.
 */
export function usePriceFlash(
  value: number | null | undefined,
): { dir: "up" | "down"; id: number } | null {
  const prev = useRef(value);
  const idRef = useRef(0);
  const [flash, setFlash] = useState<{ dir: "up" | "down"; id: number } | null>(
    null,
  );

  useEffect(() => {
    const previous = prev.current;
    prev.current = value;
    if (
      previous == null ||
      value == null ||
      !Number.isFinite(value) ||
      value === previous
    ) {
      return;
    }
    idRef.current += 1;
    setFlash({ dir: value > previous ? "up" : "down", id: idRef.current });
  }, [value]);

  return flash;
}

/**
 * Invokes `onUpdate` for every trade lifecycle event (new, status change,
 * expiry). The callback is held in a ref so passing a fresh inline function each
 * render never re-subscribes.
 */
export function useTradeUpdates(onUpdate: (update: TradeUpdate) => void): void {
  const handler = useRef(onUpdate);
  useEffect(() => {
    handler.current = onUpdate;
  });

  useEffect(() => {
    const source = getRealtimeSource();
    return source.subscribe(["trades"], (event) => {
      if (event.type === "trade.update") handler.current(event);
    });
  }, []);
}

/** The realtime connection status on its own (no data subscription). */
export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(
    () => getRealtimeSource().status,
  );
  useEffect(() => {
    const source = getRealtimeSource();
    return source.onStatus(setStatus);
  }, []);
  return status;
}
