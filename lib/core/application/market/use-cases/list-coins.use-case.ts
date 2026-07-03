import type { Coin } from "@/lib/core/domain/market/coin";
import type { Result } from "@/lib/core/domain/shared/result";
import type { MarketRepository } from "../ports/market-repository.port";

/** Returns the market coin list. */
export class ListCoinsUseCase {
  constructor(private readonly market: MarketRepository) {}

  execute(): Promise<Result<Coin[]>> {
    return this.market.listCoins();
  }
}
