import type { PlacedOrder } from "@/lib/core/domain/trade/order";

/**
 * Trade form state ("use server" files may only export async functions, so
 * these types live here beside app/actions/trade.ts).
 */
export type TradeFormState =
  | { status: "idle" }
  | { status: "error"; message: string; code?: string }
  | { status: "success"; order: PlacedOrder };

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
