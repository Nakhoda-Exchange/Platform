import type {
  ChartRange,
  CoinChart,
} from "@/lib/core/domain/market/coin-detail";
import type { Result } from "@/lib/core/domain/shared/result";
import type { MarketRepository } from "../ports/market-repository.port";

/**
 * Fetches one range's chart data (line + candles) for a coin — the source the
 * PDP calls on range toggle so 7d/1m/1y load real, honest history when it
 * exists (and an empty payload, not a fake line, when it doesn't).
 */
export class GetCoinChartUseCase {
  constructor(private readonly market: MarketRepository) {}

  execute(
    idOrSymbol: string,
    range: ChartRange,
  ): Promise<Result<CoinChart | null>> {
    return this.market.getCoinChart(idOrSymbol, range);
  }
}
