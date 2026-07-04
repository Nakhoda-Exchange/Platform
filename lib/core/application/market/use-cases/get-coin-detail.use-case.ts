import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import type { Result } from "@/lib/core/domain/shared/result";
import type { MarketRepository } from "../ports/market-repository.port";

/** Fetches the detail (header + chart + stats) for a single coin. */
export class GetCoinDetailUseCase {
  constructor(private readonly market: MarketRepository) {}

  execute(idOrSymbol: string): Promise<Result<CoinDetail | null>> {
    return this.market.getCoinDetail(idOrSymbol);
  }
}
