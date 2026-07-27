import type {
  PlaceOrderOptions,
  TradeBalances,
  TradeLimits,
  TradeLimitsMap,
  TradeRepository,
} from "@/lib/core/application/trade/ports/trade-repository.port";
import { coinDisplaySymbol, type Coin } from "@/lib/core/domain/market/coin";
import { parsePrice } from "@/lib/core/domain/market/price";
import type { TradeQuote } from "@/lib/core/domain/trade/quote";
import type {
  OpenOrder,
  OrderStatus,
  OrderStatusView,
  OrderSubmission,
  OrderType,
  TradeSide,
} from "@/lib/core/domain/trade/order";
import { fail, ok, type Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/**
 * Portfolio response shape used to derive tradable balances (doc/portfolio/api.md).
 * Money/quantity fields are decimal STRINGS on the wire (numeric(38,18)); they
 * are parsed into the numeric TradeBalances below (a legacy number is tolerated
 * too — parsePrice accepts both).
 */
interface PortfolioDto {
  availableIrt: string | number;
  holdings: Array<{
    coin: { id: string; symbol: string };
    amount: string | number;
    // Units LOCKED by open orders, when the backend surfaces a per-coin lock
    // (issue #73). Absent ⇒ nothing locked; `amount` is then fully available.
    locked?: string | number | null;
  }>;
}

/**
 * Backend trade-limits response (GET /v1/trade/limits, TradeLimitsSchema). Each
 * bound is IRT notional as an integer-string in whole Toman, or null (unbounded).
 * `defaultMinTradeIrt` is the admin-configurable global minimum order (a decimal
 * STRING in whole Toman); optional/absent on older backends.
 */
interface TradeLimitsDto {
  defaultMinTradeIrt?: string | null;
  // The caller's EFFECTIVE fee rate in basis points, when the backend surfaces
  // one on this authed payload (a caller may be discounted — issue #76).
  effectiveFeeRateBps?: number | null;
  limits: Array<{
    symbol: string;
    minBuyIrt: string | null;
    maxBuyIrt: string | null;
    minSellIrt: string | null;
    maxSellIrt: string | null;
  }>;
}

/**
 * Parse an IRT notional string (whole Toman, no float money) to a number. IRT is
 * scale-0, so an integer-string is exact within JS's safe range (backend caps
 * are in the billions, well under 2^53). A null/blank/malformed bound → null,
 * so the use case falls back to the global floor / balance cap.
 */
function parseIrtBound(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Backend quote response (POST /v1/trade/quotes, QuoteResponseSchema). Only the
 * display figures the screen uses are read; `expectedSlippageBps` is a plain
 * number in bps (0 is a real answer) or null when routing couldn't be priced.
 * Older backends omit the field entirely — also treated as unknown.
 */
interface QuoteDto {
  expectedSlippageBps?: number | null;
  // Server-minted quote fields (issue #59) — present once the backend mints a
  // fixed-price, short-TTL quote the order can reference. All optional: an older
  // backend that only prices slippage omits them.
  quoteId?: string | null;
  priceIrt?: string | number | null;
  expiresAt?: string | null;
  // The caller's effective fee rate for this quote, bps (issue #76).
  feeRateBps?: number | null;
}

/**
 * Backend order-submit result (doc/trade/api.md). A MARKET order settles
 * synchronously (200 `SETTLED`) today; a LIMIT order — and, once async
 * settlement is enabled, a MARKET order — is `ACCEPTED` (202) and rests until
 * resolved (`phase: "pending"`).
 */
interface OrderSubmitDto {
  status: "SETTLED" | "REJECTED" | "ACCEPTED";
  orderId?: string;
  phase?: string;
  reason?: string;
  // What ACTUALLY settled — the executed coin amount, and (when returned) the
  // executed unit price and fee. The receipt is built from these, not the client
  // estimate (issue #56). Decimal strings on the wire.
  amountOut?: string | null;
  executedPriceIrt?: string | null;
  feeIrt?: string | null;
  // The backend REPLAYED a prior submit for this Idempotency-Key (issue #55).
  duplicate?: boolean;
}

/** Backend order-status result (GET /orders/{orderId}). */
interface OrderStatusDto {
  orderId?: string;
  id?: string;
  status: OrderStatus;
  reason?: string | null;
  filledAmount?: string | null;
  amountOut?: string | null;
  totalIrt?: string | null;
}

/** One row of GET /orders?status=open. */
interface OpenOrderDto {
  orderId: string;
  side: string;
  symbol: string;
  displaySymbol?: string | null;
  coinDisplaySymbol?: string | null;
  orderType: string;
  targetPrice: string | null;
  amount: string;
  amountCurrency: string;
  status: OrderStatus;
  createdAt: string;
  expiresAt?: string | null;
}

interface OpenOrdersDto {
  orders: OpenOrderDto[];
}

/** Normalize a wire side to the domain union (defaults to buy for anything odd). */
function toSide(value: string): TradeSide {
  return value.toLowerCase() === "sell" ? "sell" : "buy";
}

/** Normalize a wire order-type to the domain union (defaults to MARKET). */
function toOrderType(value: string): OrderType {
  return value.toUpperCase() === "LIMIT" ? "LIMIT" : "MARKET";
}

/**
 * A rejected order carries a machine reason; surface a Persian, user-showable
 * message. Anything unmapped falls back to a generic trade error.
 */
function messageForRejection(reason: string | undefined): string {
  switch (reason) {
    case "PRICE_BAND_BREACHED":
      return "قیمت بازار تغییر کرد. دوباره تلاش کنید.";
    case "INSUFFICIENT_BALANCE":
    case "INSUFFICIENT_FUNDS":
      return "موجودی شما کافی نیست.";
    case "NO_LIQUIDITY":
    case "NO_ROUTE":
      return "امکان انجام این معامله در حال حاضر نیست.";
    default:
      return "انجام سفارش ممکن نشد. دوباره تلاش کنید.";
  }
}

/**
 * HTTP adapter for trading. Contract: doc/trade/api.md.
 *
 * The backend trade-execution API speaks integer minor units as strings; IRT is
 * whole Toman (scale 0), so `amountIrt`/`priceIrt` serialize directly. Balances
 * come from the portfolio snapshot (there is no dedicated balances endpoint):
 * cash is `availableIrt`, per-coin units are the holdings. Orders settle
 * synchronously (SETTLED/REJECTED); the receipt is built from the request the
 * use case already validated plus the returned order id.
 */
export class HttpTradeRepository implements TradeRepository {
  constructor(private readonly http: HttpClient) {}

  async getBalances(): Promise<Result<TradeBalances>> {
    const result = await this.http.get<PortfolioDto>("/portfolio");
    if (!result.ok) return result;
    const { availableIrt, holdings } = result.data;
    // Key by UPPERCASE symbol, not coin.id: the portfolio/ledger identifies an
    // asset by its currency code (lower(symbol)), while the market identifies a
    // coin by an opaque id (e.g. "dx_<contract>" for discovered tokens). Symbol
    // is the only identifier stable across both contexts, so holdings are keyed
    // and looked up by symbol — otherwise a held discovered token reads as 0.
    // Wire money/quantity are decimal strings; parse to numbers so the trade use
    // case (balance checks, coin-amount math) works on numbers.
    // Keep BOTH the parsed number (display) and the raw decimal string (exact
    // money-correct comparison / «sell all» derivation — issue #57). `locked`
    // (issue #73) is netted out so `coinAmounts` reports AVAILABLE units.
    const coinAmounts: Record<string, number> = {};
    const coinAmountsRaw: Record<string, string> = {};
    const lockedCoinAmountsRaw: Record<string, string> = {};
    for (const h of holdings) {
      const sym = h.coin.symbol.toUpperCase();
      const total = parsePrice(h.amount) ?? 0;
      const locked = parsePrice(h.locked) ?? 0;
      coinAmounts[sym] = Math.max(total - locked, 0);
      coinAmountsRaw[sym] = h.amount == null ? "0" : String(h.amount);
      if (h.locked != null) lockedCoinAmountsRaw[sym] = String(h.locked);
    }
    return ok({
      availableIrt: parsePrice(availableIrt) ?? 0,
      coinAmounts,
      availableIrtRaw: availableIrt == null ? "0" : String(availableIrt),
      coinAmountsRaw,
      lockedCoinAmountsRaw,
    });
  }

  async getLimits(): Promise<Result<TradeLimits>> {
    const result = await this.http.get<TradeLimitsDto>("/trade/limits");
    if (!result.ok) return result;
    const bySymbol: TradeLimitsMap = {};
    for (const row of result.data.limits) {
      // Key by UPPERCASE symbol — orders submit the symbol uppercased.
      bySymbol[row.symbol.toUpperCase()] = {
        minBuyIrt: parseIrtBound(row.minBuyIrt),
        maxBuyIrt: parseIrtBound(row.maxBuyIrt),
        minSellIrt: parseIrtBound(row.minSellIrt),
        maxSellIrt: parseIrtBound(row.maxSellIrt),
      };
    }
    // The admin-configurable global floor is a decimal money string; parse it
    // like any wire money field (null when absent/blank/malformed → the use case
    // falls back to the offline MIN_ORDER_IRT constant).
    const feeBps = result.data.effectiveFeeRateBps;
    return ok({
      defaultMinIrt: parsePrice(result.data.defaultMinTradeIrt),
      bySymbol,
      // The caller's effective fee rate (issue #76); a finite number survives,
      // anything else ⇒ null (the use case falls back to FEE_RATE_BPS).
      effectiveFeeRateBps:
        typeof feeBps === "number" && Number.isFinite(feeBps) ? feeBps : null,
    });
  }

  async getQuote(
    symbol: string,
    side: TradeSide,
    amountIrt: number,
  ): Promise<Result<TradeQuote>> {
    // Same amount contract as a MARKET submission: whole Toman notional with
    // `amountUnit: "IRT"` on both sides (a buy spends it, a sell receives it),
    // so the quote prices exactly the order the user is about to place.
    const result = await this.http.request<QuoteDto>({
      method: "POST",
      path: "/trade/quotes",
      headers: {},
      body: {
        symbol: symbol.toUpperCase(),
        side: side.toUpperCase(),
        amount: String(Math.round(amountIrt)),
        amountUnit: "IRT",
      },
    });
    if (!result.ok) return result;
    const bps = result.data.expectedSlippageBps;
    const feeBps = result.data.feeRateBps;
    // Absent/null/non-numeric ⇒ unknown. `0` must survive as 0 (a firm-price
    // route), so this is a typeof check, not a falsy one.
    return ok({
      expectedSlippageBps:
        typeof bps === "number" && Number.isFinite(bps) ? bps : null,
      // Server-minted quote reference (issue #59): threaded through so the order
      // can commit to a fixed price. Absent on an older backend ⇒ null/undefined.
      quoteId: result.data.quoteId ?? null,
      priceIrt: parsePrice(result.data.priceIrt),
      expiresAt: result.data.expiresAt ?? null,
      feeRateBps:
        typeof feeBps === "number" && Number.isFinite(feeBps) ? feeBps : null,
    });
  }

  async placeOrder(
    coin: Coin,
    side: TradeSide,
    amountCoin: number,
    totalIrt: number,
    feeIrt: number,
    idempotencyKey: string,
    options?: PlaceOrderOptions,
  ): Promise<Result<OrderSubmission>> {
    const orderType: OrderType = options?.orderType ?? "MARKET";
    const isLimit = orderType === "LIMIT";
    // The EXACT coin amount for the wire — the raw held string on a «sell all»
    // (issue #57), else the derived number stringified. Avoids re-introducing
    // float loss when serializing the committed amount.
    const coinAmountWire = options?.amountCoinRaw ?? String(amountCoin);
    // Coin price is a nullable decimal string on the wire; the band price the
    // order is submitted against needs a number. For a MARKET order the caller
    // (PlaceOrderUseCase) already refuses an unavailable price, so this is
    // effectively non-null (0 only as an unreachable bridge, never displayed).
    const unitPriceIrt = parsePrice(coin.priceIrt) ?? 0;

    // A MARKET order sends `amount` as whole Toman with `amountUnit: "IRT"` for
    // BOTH sides (a buy spends it, a sell targets it to receive) — the settled,
    // backward-compatible contract. A LIMIT order is SPEND-committed, so the
    // spend unit differs by side: a BUY commits an IRT amount, a SELL commits a
    // coin amount (the backend rejects a TARGET-unit limit). `targetPrice` is
    // the whole-Toman trigger. A server-minted `quoteId` (issue #59) rides along
    // when the screen obtained a fixed-price quote — the backend then prices the
    // fill at the quote instead of the client `requestedPrice` band.
    const body: Record<string, string> = isLimit
      ? {
          symbol: coin.symbol.toUpperCase(),
          side: side.toUpperCase(),
          orderType: "LIMIT",
          targetPrice: String(Math.round(options?.targetPriceIrt ?? 0)),
          ...(side === "buy"
            ? { amount: String(Math.round(totalIrt)), amountUnit: "IRT" }
            : {
                amount: coinAmountWire,
                amountUnit: coin.symbol.toUpperCase(),
              }),
        }
      : {
          symbol: coin.symbol.toUpperCase(),
          side: side.toUpperCase(),
          orderType: "MARKET",
          amount: String(Math.round(totalIrt)),
          amountUnit: "IRT",
          requestedPrice: String(Math.round(unitPriceIrt)),
        };

    // The user's own tolerance rides along when they set one; omitted entirely
    // otherwise so the backend resolves the coin's configured value.
    if (options?.slippageBps != null && Number.isFinite(options.slippageBps)) {
      body.slippageBps = String(Math.round(options.slippageBps));
    }
    if (options?.quoteId) body.quoteId = options.quoteId;

    // The Idempotency-Key is the caller's, minted ONCE per user intent and
    // REUSED on retry — so a retry after a lost response replays the original
    // settlement instead of executing twice (issue #55). NOT minted here.
    const result = await this.http.request<OrderSubmitDto>({
      method: "POST",
      path: "/trade/orders",
      headers: { "Idempotency-Key": idempotencyKey },
      body,
    });
    if (!result.ok) return result;

    // The backend replays the original response for a repeated key and flags it.
    const duplicate = result.data.duplicate === true;

    // 202 ACCEPTED — the order rests/pends; hand back its id so the caller polls
    // it to completion. (A LIMIT order always lands here; a MARKET order will
    // too once async settlement is enabled.)
    if (result.data.status === "ACCEPTED") {
      return ok({
        kind: "accepted",
        orderId: result.data.orderId ?? "",
        phase: result.data.phase ?? "pending",
        duplicate,
      });
    }

    // 200 REJECTED — surface the Persian reason.
    if (result.data.status !== "SETTLED") {
      return fail("ORDER_REJECTED", messageForRejection(result.data.reason));
    }

    // 200 SETTLED — build the receipt from what ACTUALLY settled (issue #56): the
    // backend's executed `amountOut` (and executed price/fee when returned), not
    // the client estimate. Only when the backend returns no `amountOut` do we
    // fall back to the pre-trade estimate, flagged `estimated` for the UI marker.
    const settledCoin = parsePrice(result.data.amountOut);
    const executedPrice = parsePrice(result.data.executedPriceIrt);
    const executedFee = parsePrice(result.data.feeIrt);
    return ok({
      kind: "settled",
      order: {
        id: result.data.orderId ?? "",
        side,
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        amountCoin: settledCoin ?? amountCoin,
        totalIrt,
        feeIrt: executedFee ?? feeIrt,
        // Executed price when the backend returns one; else a LIMIT fill executed
        // at its target and a MARKET fill at the live price (the estimate).
        priceIrt:
          executedPrice ??
          (isLimit ? (options?.targetPriceIrt ?? 0) : unitPriceIrt),
        estimated: settledCoin === null,
        duplicate,
      },
    });
  }

  async getOrder(orderId: string): Promise<Result<OrderStatusView>> {
    const result = await this.http.get<OrderStatusDto>(
      `/trade/orders/${encodeURIComponent(orderId)}`,
    );
    if (!result.ok) return result;
    const dto = result.data;
    return ok({
      orderId: dto.orderId ?? dto.id ?? orderId,
      status: dto.status,
      reason: dto.reason ?? null,
      filledCoin: parsePrice(dto.filledAmount ?? dto.amountOut),
      totalIrt: parsePrice(dto.totalIrt),
    });
  }

  async listOpenOrders(): Promise<Result<OpenOrder[]>> {
    const result = await this.http.get<OpenOrdersDto>(
      "/trade/orders?status=open",
    );
    if (!result.ok) return result;
    const orders = (result.data.orders ?? []).map((o): OpenOrder => {
      const symbol = o.symbol.toUpperCase();
      return {
        orderId: o.orderId,
        side: toSide(o.side),
        symbol,
        // Prefer the operator display alias when the backend sends one; else the
        // canonical symbol. `coinDisplaySymbol` reuses the market's alias rule.
        displaySymbol:
          o.coinDisplaySymbol?.trim() ||
          o.displaySymbol?.trim() ||
          coinDisplaySymbol({ symbol }),
        orderType: toOrderType(o.orderType),
        targetPrice: parsePrice(o.targetPrice),
        amount: parsePrice(o.amount) ?? 0,
        amountCurrency: o.amountCurrency,
        status: o.status,
        createdAt: o.createdAt,
        expiresAt: o.expiresAt ?? null,
      };
    });
    return ok(orders);
  }

  async cancelOrder(orderId: string): Promise<Result<void>> {
    const result = await this.http.request<unknown>({
      method: "POST",
      path: `/trade/orders/${encodeURIComponent(orderId)}/cancel`,
      headers: {},
    });
    if (result.ok) return ok(undefined);
    // A 409 means the order already executed (raced the cancel). Map it to a
    // stable code so the UI can say «already executed» and refresh the list,
    // rather than showing a generic error.
    if (result.error.code === "HTTP_409") {
      return fail(
        "ORDER_ALREADY_EXECUTED",
        "این سفارش پیش‌تر انجام شده و دیگر قابل لغو نیست.",
      );
    }
    return result;
  }
}
