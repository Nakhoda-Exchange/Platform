/**
 * The realtime event contract the platform consumes over the WebSocket. Mirrors
 * the frames the backend's `GET /ws` emits (Substructure `src/modules/realtime`).
 * Money is integer Toman and every time is epoch ms, per `doc/api-conventions.md`.
 * Contract: `doc/realtime/api.md`.
 */

/** Channels a client subscribes to; an event belongs to exactly one. */
export const REALTIME_CHANNELS = ["prices", "trades"] as const;
export type RealtimeChannel = (typeof REALTIME_CHANNELS)[number];

/** A live price tick for one coin (channel: `prices`). */
export interface PriceTick {
  type: "price";
  coinId: string;
  symbol: string;
  priceIrt: number;
  priceUsd: number;
  change24h: number; // signed percent vs the ~24h reference
  at: number; // epoch ms
}

/**
 * Lifecycle status of a trade order: `pending`/`open` are live (carry an
 * `expiresAt`), `done` filled, `expired` lapsed past its deadline, `failed`
 * rejected.
 */
export type TradeStatus = "pending" | "open" | "done" | "expired" | "failed";

/** A trade lifecycle update — new trades, status changes, and expiry (channel: `trades`). */
export interface TradeUpdate {
  type: "trade.update";
  tradeId: string;
  coinId: string;
  symbol: string;
  side: "buy" | "sell";
  status: TradeStatus;
  amountCoin: number;
  priceIrt: number;
  totalIrt: number;
  expiresAt?: number; // present only while pending/open
  at: number; // epoch ms of this update
}

/** The server→client data union delivered on subscribed channels. */
export type RealtimeEvent = PriceTick | TradeUpdate;

/** Whether the value is a well-formed realtime data event (narrows unknown frames). */
export function isRealtimeEvent(value: unknown): value is RealtimeEvent {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as { type?: unknown }).type;
  return type === "price" || type === "trade.update";
}

/** The channel an event is delivered on. */
export function channelOf(event: RealtimeEvent): RealtimeChannel {
  return event.type === "price" ? "prices" : "trades";
}
