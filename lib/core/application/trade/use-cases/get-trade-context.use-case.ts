import type {
  TokenTradeLimits,
  TradeContext,
} from "@/lib/core/domain/trade/order";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { TradeRepository } from "../ports/trade-repository.port";

/** All-null bounds — used when the backend serves no limit for this token. */
const NO_LIMITS: TokenTradeLimits = {
  minBuyIrt: null,
  maxBuyIrt: null,
  minSellIrt: null,
  maxSellIrt: null,
};

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

    // Per-token min/max bounds power the screen's validation. A limits failure
    // must not block trading, so fall back to all-null (→ global MIN_ORDER_IRT
    // floor + balance-capped max) rather than propagating the error.
    const limitsResult = await this.trade.getLimits();
    const limits = limitsResult.ok
      ? (limitsResult.data[coin.symbol.toUpperCase()] ?? NO_LIMITS)
      : NO_LIMITS;

    return ok({
      coin,
      availableIrt: balances.data.availableIrt,
      // Balances are keyed by symbol (portfolio ids ≠ market ids for tokens).
      availableCoin: balances.data.coinAmounts[coin.symbol.toUpperCase()] ?? 0,
      limits,
    });
  }
}
