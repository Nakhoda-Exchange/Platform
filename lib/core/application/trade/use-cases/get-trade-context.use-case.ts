import type { TradeContext } from "@/lib/core/domain/trade/order";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { TradeRepository } from "../ports/trade-repository.port";

/** Loads the coin + the user's balances for the trade screen; null if unknown coin. */
export class GetTradeContextUseCase {
  constructor(
    private readonly market: MarketRepository,
    private readonly trade: TradeRepository,
  ) {}

  async execute(idOrSymbol: string): Promise<Result<TradeContext | null>> {
    const coins = await this.market.listCoins();
    if (!coins.ok) return coins;
    const key = idOrSymbol.toLowerCase();
    const coin = coins.data.find(
      (c) => c.id === key || c.symbol.toLowerCase() === key,
    );
    if (!coin) return ok(null);

    const balances = await this.trade.getBalances();
    if (!balances.ok) return balances;

    return ok({
      coin,
      availableIrt: balances.data.availableIrt,
      availableCoin: balances.data.coinAmounts[coin.id] ?? 0,
    });
  }
}
