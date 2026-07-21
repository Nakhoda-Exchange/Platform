import type {
  TradeBalances,
  TradeLimits,
  TradeLimitsMap,
  TradeRepository,
} from "@/lib/core/application/trade/ports/trade-repository.port";
import type { Coin } from "@/lib/core/domain/market/coin";
import { parsePrice } from "@/lib/core/domain/market/price";
import type { PlacedOrder, TradeSide } from "@/lib/core/domain/trade/order";
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

/** Backend trade-execution result (doc/trade/api.md, SubmitTrade → TradeResult). */
interface TradeResultDto {
  status: "SETTLED" | "REJECTED";
  orderId?: string;
  reason?: string;
  amountOut?: string;
  duplicate?: boolean;
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
    const coinAmounts: Record<string, number> = {};
    for (const h of holdings)
      coinAmounts[h.coin.symbol.toUpperCase()] = parsePrice(h.amount) ?? 0;
    return ok({ availableIrt: parsePrice(availableIrt) ?? 0, coinAmounts });
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
    return ok({
      defaultMinIrt: parsePrice(result.data.defaultMinTradeIrt),
      bySymbol,
    });
  }

  async placeOrder(
    coin: Coin,
    side: TradeSide,
    amountCoin: number,
    totalIrt: number,
    feeIrt: number,
  ): Promise<Result<PlacedOrder>> {
    // amountUnit IRT for both sides: a buy spends `totalIrt`, a sell targets
    // `totalIrt` to receive — matching what the user entered in Toman, so no
    // coin-decimal conversion is needed here. requestedPrice is the current
    // unit price (Toman/coin) the order is banded against. The backend requires
    // an Idempotency-Key so a retried submit settles once; a fresh key per
    // placeOrder call marks this as a distinct order.
    // Coin price is a nullable decimal string on the wire; the band price the
    // order is submitted against needs a number. The caller (PlaceOrderUseCase)
    // already refuses an unavailable price, so this is effectively non-null here
    // — parse defensively (0 only as an unreachable bridge, never displayed).
    const unitPriceIrt = parsePrice(coin.priceIrt) ?? 0;
    const result = await this.http.request<TradeResultDto>({
      method: "POST",
      path: "/trade/orders",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: {
        symbol: coin.symbol.toUpperCase(),
        side: side.toUpperCase(),
        amount: String(Math.round(totalIrt)),
        amountUnit: "IRT",
        requestedPrice: String(Math.round(unitPriceIrt)),
      },
    });
    if (!result.ok) return result;

    if (result.data.status !== "SETTLED") {
      return fail("ORDER_REJECTED", messageForRejection(result.data.reason));
    }

    // Build the receipt from the validated request inputs plus the order id;
    // the backend result carries settlement status, not the display fields.
    return ok({
      id: result.data.orderId ?? "",
      side,
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      amountCoin,
      totalIrt,
      feeIrt,
      priceIrt: unitPriceIrt,
    });
  }
}
