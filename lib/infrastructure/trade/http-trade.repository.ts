import type {
  TradeBalances,
  TradeRepository,
} from "@/lib/core/application/trade/ports/trade-repository.port";
import type { Coin } from "@/lib/core/domain/market/coin";
import type { PlacedOrder, TradeSide } from "@/lib/core/domain/trade/order";
import { fail, ok, type Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** Portfolio response shape used to derive tradable balances (doc/portfolio/api.md). */
interface PortfolioDto {
  availableIrt: number;
  holdings: Array<{ coin: { id: string }; amount: number }>;
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
    const coinAmounts: Record<string, number> = {};
    for (const h of holdings) coinAmounts[h.coin.id] = h.amount;
    return ok({ availableIrt, coinAmounts });
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
    const result = await this.http.request<TradeResultDto>({
      method: "POST",
      path: "/trade/orders",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: {
        symbol: coin.symbol.toUpperCase(),
        side: side.toUpperCase(),
        amount: String(Math.round(totalIrt)),
        amountUnit: "IRT",
        requestedPrice: String(Math.round(coin.priceIrt)),
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
      priceIrt: coin.priceIrt,
    });
  }
}
