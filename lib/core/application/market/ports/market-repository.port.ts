import type { Coin } from "@/lib/core/domain/market/coin";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for market data. Concrete adapters live in the infrastructure layer. */
export interface MarketRepository {
  /** All tradable coins for the market list. */
  listCoins(): Promise<Result<Coin[]>>;
}
