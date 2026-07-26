import type { Coin } from "@/lib/core/domain/market/coin";
import type {
  OpenOrder,
  OrderStatusView,
  OrderSubmission,
  OrderType,
  TokenTradeLimits,
  TradeSide,
} from "@/lib/core/domain/trade/order";
import type { TradeQuote } from "@/lib/core/domain/trade/quote";
import type { Result } from "@/lib/core/domain/shared/result";

/**
 * The user's tradable balances: cash + units held, keyed by UPPERCASE symbol
 * (e.g. "BONK"). Symbol — not coin id — is the key, because the portfolio and
 * market contexts assign different ids to the same discovered token.
 */
export interface TradeBalances {
  availableIrt: number;
  // AVAILABLE (spendable) units per coin — total held minus anything locked.
  coinAmounts: Record<string, number>;
  // The same figures as their raw decimal STRINGS (numeric(38,18)), kept exact
  // for money-correct comparison and «sell all» derivation — parsing to `number`
  // loses digits (issue #57). Absent on a legacy adapter → callers fall back to
  // the number fields.
  availableIrtRaw?: string;
  coinAmountsRaw?: Record<string, string>;
  // Units LOCKED per coin by open orders (raw decimal strings), so `coinAmounts`
  // can be reported net of them and a balance can't be spent twice across the
  // pending→open window (issue #73). Absent/empty ⇒ nothing locked (the backend
  // does not yet surface a per-coin lock — documented as an Agent 4 contract).
  lockedCoinAmountsRaw?: Record<string, string>;
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
  // The caller's EFFECTIVE fee rate (basis points) from the backend, when it
  // surfaces one — a referral invitee is discounted, so the fixed FEE_RATE would
  // mismatch (issue #76). `null`/absent ⇒ the offline FEE_RATE_BPS default.
  effectiveFeeRateBps?: number | null;
}

/** Extra fields an order carries alongside the positional args. */
export interface PlaceOrderOptions {
  orderType: OrderType;
  /**
   * The USER's own slippage tolerance in bps, when they set one in the trade
   * settings sheet. It OVERRIDES the coin's configured tolerance — their money,
   * their call. Absent/null ⇒ the backend resolves the coin's own value.
   */
  slippageBps?: number | null;
  /** Whole IRT per whole coin (the trigger price). Required for LIMIT. */
  targetPriceIrt?: number | null;
  /**
   * EXACT coin amount as a decimal string (numeric(38,18)) for the wire, used
   * instead of the lossy `String(amountCoin)` — set on a «sell all» so the full
   * held balance is sold without float precision loss (issue #57).
   */
  amountCoinRaw?: string;
  /**
   * The server-minted quote this order commits to (issue #59). When present the
   * backend prices the fill at the quote's locked price (house bears intra-TTL
   * slippage) instead of the client `requestedPrice` band. Absent ⇒ band model.
   */
  quoteId?: string | null;
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
   * Price an order WITHOUT placing it (POST /v1/trade/quotes) — the pre-commit
   * quote the trade screen reads the expected slippage from. `amountIrt` is the
   * order's Toman notional (what a buy spends / a sell receives), matching how
   * a market order is submitted.
   */
  getQuote(
    symbol: string,
    side: TradeSide,
    amountIrt: number,
  ): Promise<Result<TradeQuote>>;
  /**
   * Submit an order. Returns a settled receipt (200) OR an accepted handle (202)
   * the caller polls to completion — see {@link OrderSubmission}. A MARKET order
   * omits `options` (or passes `orderType: "MARKET"`); a LIMIT order passes
   * `orderType: "LIMIT"` with a `targetPriceIrt`.
   *
   * `idempotencyKey` is minted ONCE per user intent by the caller (when the
   * confirm sheet opens) and REUSED on every retry — the adapter forwards it as
   * the `Idempotency-Key` header, so a retry after a lost response replays the
   * original settlement instead of executing twice (issue #55). The adapter must
   * NOT mint its own key.
   */
  placeOrder(
    coin: Coin,
    side: TradeSide,
    amountCoin: number,
    totalIrt: number,
    feeIrt: number,
    idempotencyKey: string,
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
