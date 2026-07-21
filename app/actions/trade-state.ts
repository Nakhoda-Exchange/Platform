import type { OrderStatus, PlacedOrder } from "@/lib/core/domain/trade/order";

/**
 * Trade form state ("use server" files may only export async functions, so
 * these types live here beside app/actions/trade.ts).
 *
 * `success` is a synchronous fill (200 SETTLED). `accepted` is a 202 ACCEPTED
 * order that now rests/pends — the screen enters a pending state and polls
 * `resolveOrder(orderId)` until terminal.
 */
export type TradeFormState =
  | { status: "idle" }
  | { status: "error"; message: string; code?: string }
  | { status: "success"; order: PlacedOrder }
  | {
      status: "accepted";
      orderId: string;
      phase: string;
      orderType: "MARKET" | "LIMIT";
    };

/**
 * Terminal (or timed-out) result of polling a 202-accepted order. `TIMEOUT`
 * means the poll budget elapsed while the order was still resting — not an
 * error; the order is safe in the open-orders list and the UI hands off there.
 */
export type ResolveOrderState =
  | { status: OrderStatus | "TIMEOUT"; reason?: string | null }
  | { status: "error"; message: string };

/**
 * Error code the trade endpoint returns (HTTP 503) when the live market price
 * expired and couldn't be refreshed. The trade screen special-cases it: a
 * retry toast instead of the inline error, because the user just needs to try
 * again in a moment. (HTTP_503 is the http-client fallback when the body
 * carries no `code`.)
 */
export const PRICE_UNAVAILABLE_CODES = [
  "PRICE_UNAVAILABLE",
  "HTTP_503",
] as const;
