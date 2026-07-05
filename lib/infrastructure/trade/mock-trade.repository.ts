import type {
  TradeBalances,
  TradeRepository,
} from "@/lib/core/application/trade/ports/trade-repository.port";
import type { Coin } from "@/lib/core/domain/market/coin";
import type { PlacedOrder, TradeSide } from "@/lib/core/domain/trade/order";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import { settleTrade, wallet } from "../portfolio/mock-wallet-state";

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Executes orders against the shared in-memory mock wallet. */
export class MockTradeRepository implements TradeRepository {
  async getBalances(): Promise<Result<TradeBalances>> {
    await delay(150);
    const coinAmounts: Record<string, number> = {};
    for (const h of wallet.holdings) coinAmounts[h.coin.id] = h.amount;
    return ok({ availableIrt: wallet.irt, coinAmounts });
  }

  async placeOrder(
    coin: Coin,
    side: TradeSide,
    amountCoin: number,
    totalIrt: number,
    feeIrt: number,
  ): Promise<Result<PlacedOrder>> {
    await delay();
    settleTrade(coin, side, amountCoin, totalIrt, feeIrt);
    return ok({
      id: crypto.randomUUID(),
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
