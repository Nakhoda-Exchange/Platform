import type { Coin } from "@/lib/core/domain/market/coin";

export type TradeSide = "buy" | "sell";

/**
 * How an order executes. A MARKET order fills at the current price (today it
 * settles synchronously); a LIMIT order rests until the market reaches its
 * `targetPrice`. LIMIT is SPEND-committed — a BUY commits an IRT amount, a SELL
 * commits a coin amount — see {@link OpenOrder}.
 */
export type OrderType = "MARKET" | "LIMIT";

/**
 * Lifecycle status of an order (GET /orders/{id} and the open-orders list).
 * `RESERVED` is the only NON-terminal state — the order is still resting/pending
 * with its reserve held. The other three are terminal (see {@link isTerminalStatus}).
 */
export type OrderStatus = "RESERVED" | "SETTLED" | "REJECTED" | "CANCELLED";

/** Whether an order status is final (no further polling needed). */
export function isTerminalStatus(status: OrderStatus): boolean {
  return (
    status === "SETTLED" || status === "REJECTED" || status === "CANCELLED"
  );
}

/**
 * Last-resort smallest order the platform accepts, in Toman. Used only OFFLINE —
 * when the backend serves neither a per-token min NOR the admin-configurable
 * global floor (`defaultMinIrt`, GET /v1/trade/limits). Resolution order is
 * per-token min → API global floor → this constant (see {@link minOrderIrt}).
 */
export const MIN_ORDER_IRT = 500_000;

/**
 * Per-token order-size bounds as IRT notional (whole Toman), from the backend
 * `GET /v1/trade/limits`. `null` means "unbounded on that side" — fall back to
 * {@link MIN_ORDER_IRT} for a missing min, and to the balance cap for a missing
 * max. Buy and sell can differ, so they are held separately.
 */
export interface TokenTradeLimits {
  minBuyIrt: number | null;
  maxBuyIrt: number | null;
  minSellIrt: number | null;
  maxSellIrt: number | null;
}

/**
 * The effective minimum order (Toman) for a side. Resolution order: the
 * per-token min (authoritative when set) → the admin-configurable global floor
 * (`defaultMinIrt`, from GET /v1/trade/limits) → the offline {@link MIN_ORDER_IRT}
 * constant. Pass `defaultMinIrt` (already parsed to a number, or null/undefined
 * when the API omits it) from the trade context / limits payload.
 */
export function minOrderIrt(
  limits: TokenTradeLimits | undefined,
  side: TradeSide,
  defaultMinIrt?: number | null,
): number {
  const perToken = side === "buy" ? limits?.minBuyIrt : limits?.minSellIrt;
  return perToken ?? defaultMinIrt ?? MIN_ORDER_IRT;
}

/** The per-token maximum order (Toman) for a side, or null when the backend sets none. */
export function maxOrderIrt(
  limits: TokenTradeLimits | undefined,
  side: TradeSide,
): number | null {
  return (side === "buy" ? limits?.maxBuyIrt : limits?.maxSellIrt) ?? null;
}

/**
 * Market-order fee (0.35%, competitive with Nobitex/Wallex). The revenue
 * engine the referral program shares — see doc/referral/PRD.md.
 */
export const FEE_RATE = 0.0035;

/** Everything the trade screen needs to open for a coin. */
export interface TradeContext {
  coin: Coin;
  availableIrt: number; // cash balance, Toman
  availableCoin: number; // units of this coin held (0 if none)
  limits: TokenTradeLimits; // per-token min/max bounds (nulls when unbounded)
  // Admin-configurable global minimum order (whole Toman) from the API; the
  // floor when this token has no per-token min. `null` when the API omits it
  // (→ the offline MIN_ORDER_IRT fallback). See {@link minOrderIrt}.
  defaultMinIrt: number | null;
}

/** A successfully placed (settled) order — the fill receipt. */
export interface PlacedOrder {
  id: string;
  side: TradeSide;
  coinId: string;
  symbol: string;
  name: string; // Persian coin name for the receipt
  amountCoin: number; // units bought/sold
  totalIrt: number; // total value, Toman (what the user entered)
  feeIrt: number; // platform fee charged, Toman
  priceIrt: number; // unit price at execution, Toman
}

/**
 * The outcome of submitting an order. The backend answers in one of two ways:
 *
 * - `settled` — a synchronous fill (HTTP 200, `status: SETTLED`). This is what a
 *   MARKET order returns today (the async settlement flag is OFF).
 * - `accepted` — the order was ACCEPTED (HTTP 202) and now rests/pends
 *   (`phase: "pending"`). A LIMIT order ALWAYS lands here (it rests until its
 *   price trigger); a MARKET order will too once async settlement is enabled.
 *   The caller polls `GET /orders/{orderId}` until the status is terminal.
 */
export type OrderSubmission =
  | { kind: "settled"; order: PlacedOrder }
  | { kind: "accepted"; orderId: string; phase: string };

/**
 * A point-in-time view of an order from `GET /orders/{orderId}` — its lifecycle
 * status plus (when known) the resolved fill amounts and a rejection reason.
 * Used by the poll loop to detect a terminal state.
 */
export interface OrderStatusView {
  orderId: string;
  status: OrderStatus;
  reason?: string | null; // machine reason when REJECTED
  filledCoin?: number | null; // coin units filled (SETTLED)
  totalIrt?: number | null; // IRT notional (SETTLED)
}

/**
 * A resting order in the user's open-orders list (`GET /orders?status=open`).
 * Money/quantity are parsed to numbers; `targetPrice` is whole IRT per whole
 * coin (null for a market order). `amount` is the SPEND amount in `amountCurrency`
 * ("IRT" for a BUY, the coin symbol for a SELL).
 */
export interface OpenOrder {
  orderId: string;
  side: TradeSide;
  symbol: string; // canonical ticker (identifier)
  displaySymbol: string; // label to show the user (alias when set)
  orderType: OrderType;
  targetPrice: number | null; // whole IRT per coin (limit only)
  amount: number; // committed spend amount
  amountCurrency: string; // "IRT" (buy) or coin symbol (sell)
  status: OrderStatus;
  createdAt: string; // ISO timestamp
  expiresAt: string | null; // ISO timestamp, when set
}
