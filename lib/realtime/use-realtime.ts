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
