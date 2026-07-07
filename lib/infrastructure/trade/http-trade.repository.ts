import type {
  TradeBalances,
  TradeRepository,
} from "@/lib/core/application/trade/ports/trade-repository.port";
import type { Coin } from "@/lib/core/domain/market/coin";
import type { PlacedOrder, TradeSide } from "@/lib/core/domain/trade/order";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter for trading. Contract: doc/trade/api.md. */
export class HttpTradeRepository implements TradeRepository {
  constructor(private readonly http: HttpClient) {}

  getBalances(): Promise<Result<TradeBalances>> {
    return this.http.get<TradeBalances>("/trade/balances");
  }

  placeOrder(
    coin: Coin,
    side: TradeSide,
    amountCoin: number,
    totalIrt: number,
    feeIrt: number,
  ): Promise<Result<PlacedOrder>> {
    return this.http.post<PlacedOrder>("/trade/orders", {
      coinId: coin.id,
      side,
      amountCoin,
      totalIrt,
      feeIrt,
    });
  }
}
