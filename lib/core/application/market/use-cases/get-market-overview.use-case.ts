import type { Coin } from "@/lib/core/domain/market/coin";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { MarketRepository } from "../ports/market-repository.port";

/** The market/discover screen's sections, derived from the coin list. */
export interface MarketOverview {
  topGainers: Coin[]; // biggest 24h winners
  trending: Coin[]; // most popular (by market cap)
  newCoins: Coin[]; // recently listed
  all: Coin[]; // full list for browse + search
}

export class GetMarketOverviewUseCase {
  constructor(private readonly market: MarketRepository) {}

  async execute(): Promise<Result<MarketOverview>> {
    const result = await this.market.listCoins();
    if (!result.ok) return result;
    const all = result.data;

    const topGainers = all
      .filter((c) => c.change24h > 0)
      .sort((a, b) => b.change24h - a.change24h)
      .slice(0, 6);
    const trending = [...all]
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 6);
    const newCoins = all.filter((c) => c.isNew);

    return ok({ topGainers, trending, newCoins, all });
  }
}
