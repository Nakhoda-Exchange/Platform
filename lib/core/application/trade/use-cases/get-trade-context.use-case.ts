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

    // Per-token min/max bounds power the screen's validation, alongside the
    // admin-configurable global min floor. On a limits FETCH FAILURE the screen
    // still opens (best-effort offline fallbacks), but `limitsAvailable: false`
    // lets it warn — and the authoritative placement guard BLOCKS rather than
    // trading below the venue minimum (issue #53).
    const limitsResult = await this.trade.getLimits();
    const limits = limitsResult.ok
      ? (limitsResult.data.bySymbol[coin.symbol.toUpperCase()] ?? NO_LIMITS)
      : NO_LIMITS;
    const defaultMinIrt = limitsResult.ok
      ? limitsResult.data.defaultMinIrt
      : null;

    return ok({
      coin,
      availableIrt: balances.data.availableIrt,
      // Balances are keyed by symbol (portfolio ids ≠ market ids for tokens);
      // `coinAmounts` is already AVAILABLE (net of anything locked — issue #73).
      availableCoin: balances.data.coinAmounts[coin.symbol.toUpperCase()] ?? 0,
      limits,
      defaultMinIrt,
      limitsAvailable: limitsResult.ok,
      effectiveFeeRateBps: limitsResult.ok
        ? (limitsResult.data.effectiveFeeRateBps ?? null)
        : null,
    });
  }
}
