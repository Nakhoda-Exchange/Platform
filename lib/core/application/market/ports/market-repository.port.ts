import type { Coin } from "@/lib/core/domain/market/coin";
import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for market data. Concrete adapters live in the infrastructure layer. */
export interface MarketRepository {
  /** All tradable coins for the market list. */
  listCoins(): Promise<Result<Coin[]>>;
  /** Detail (chart + stats) for one coin, by id or lowercase symbol; null if unknown. */
  getCoinDetail(idOrSymbol: string): Promise<Result<CoinDetail | null>>;
}
