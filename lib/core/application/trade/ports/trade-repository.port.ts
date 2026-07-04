import type { Coin } from "@/lib/core/domain/market/coin";
import type { PlacedOrder, TradeSide } from "@/lib/core/domain/trade/order";
import type { Result } from "@/lib/core/domain/shared/result";

/** The user's tradable balances: cash + units held per coin id. */
export interface TradeBalances {
  availableIrt: number;
  coinAmounts: Record<string, number>;
}

/**
 * Port for trading. Validation (min order, sufficient balance) lives in the
 * use case; the adapter executes the order and settles balances.
 */
export interface TradeRepository {
  getBalances(): Promise<Result<TradeBalances>>;
  placeOrder(
    coin: Coin,
    side: TradeSide,
    amountCoin: number,
    totalIrt: number,
  ): Promise<Result<PlacedOrder>>;
}
