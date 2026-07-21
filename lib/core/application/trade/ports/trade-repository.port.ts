import type { Coin } from "@/lib/core/domain/market/coin";
import type {
  OpenOrder,
  OrderStatusView,
  OrderSubmission,
  OrderType,
  TokenTradeLimits,
  TradeSide,
} from "@/lib/core/domain/trade/order";
import type { Result } from "@/lib/core/domain/shared/result";

/**
 * The user's tradable balances: cash + units held, keyed by UPPERCASE symbol
 * (e.g. "BONK"). Symbol — not coin id — is the key, because the portfolio and
 * market contexts assign different ids to the same discovered token.
 */
export interface TradeBalances {
  availableIrt: number;
  coinAmounts: Record<string, number>;
}

/** Per-token trade limits keyed by UPPERCASE symbol (e.g. "SOL"). */
export type TradeLimitsMap = Record<string, TokenTradeLimits>;

/**
 * The full GET /v1/trade/limits payload: the admin-configurable global minimum
 * order floor plus the per-token bounds. `defaultMinIrt` is whole Toman (already
 * parsed to a number), or `null` when the backend omits it — callers then fall
 * back to the offline MIN_ORDER_IRT constant.
 */
export interface TradeLimits {
  defaultMinIrt: number | null;
  bySymbol: TradeLimitsMap;
}

/** Extra fields a LIMIT order carries; absent/`orderType: "MARKET"` for a market order. */
export interface PlaceOrderOptions {
  orderType: OrderType;
  /** Whole IRT per whole coin (the trigger price). Required for LIMIT. */
  targetPriceIrt?: number | null;
}

/**
 * Port for trading. Validation (min order, sufficient balance) lives in the
 * use case; the adapter executes the order and settles balances.
 */
export interface TradeRepository {
  getBalances(): Promise<Result<TradeBalances>>;
  /**
   * The global min floor + per-token min/max order bounds (GET /v1/trade/limits).
   */
  getLimits(): Promise<Result<TradeLimits>>;
  /**
   * Submit an order. Returns a settled receipt (200) OR an accepted handle (202)
   * the caller polls to completion — see {@link OrderSubmission}. A MARKET order
   * omits `options` (or passes `orderType: "MARKET"`); a LIMIT order passes
   * `orderType: "LIMIT"` with a `targetPriceIrt`.
   */
  placeOrder(
    coin: Coin,
    side: TradeSide,
    amountCoin: number,
    totalIrt: number,
    feeIrt: number,
    options?: PlaceOrderOptions,
  ): Promise<Result<OrderSubmission>>;
  /** A single status read of an order (GET /orders/{orderId}) — drives the poll loop. */
  getOrder(orderId: string): Promise<Result<OrderStatusView>>;
  /** The user's resting orders (GET /orders?status=open). */
  listOpenOrders(): Promise<Result<OpenOrder[]>>;
  /**
   * Cancel a resting order (POST /orders/{orderId}/cancel). Fails with
   * `ORDER_ALREADY_EXECUTED` when the backend answers 409 (it already executed).
   */
  cancelOrder(orderId: string): Promise<Result<void>>;
}
