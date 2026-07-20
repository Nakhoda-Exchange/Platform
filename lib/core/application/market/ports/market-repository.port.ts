import type { Coin } from "@/lib/core/domain/market/coin";
import type {
  ChartRange,
  CoinChart,
  CoinDetail,
} from "@/lib/core/domain/market/coin-detail";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for market data. Concrete adapters live in the infrastructure layer. */
export interface MarketRepository {
  /** All tradable coins for the market list. */
  listCoins(): Promise<Result<Coin[]>>;
  /** Detail (chart + stats) for one coin, by id or lowercase symbol; null if unknown. */
  getCoinDetail(idOrSymbol: string): Promise<Result<CoinDetail | null>>;
  /**
   * Chart data (line + candles) for one coin over a single range — the
   * fetch-on-toggle source for 7d/1m/1y. Empty arrays when the coin has no
   * history for that range yet; null when the coin itself is unknown.
   */
  getCoinChart(
    idOrSymbol: string,
    range: ChartRange,
  ): Promise<Result<CoinChart | null>>;
}
