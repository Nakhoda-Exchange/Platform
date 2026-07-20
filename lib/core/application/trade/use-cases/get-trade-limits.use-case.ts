import type { TokenTradeLimits } from "@/lib/core/domain/trade/order";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { TradeRepository } from "../ports/trade-repository.port";

/** One row of the all-symbols trade-limits list: the symbol plus its bounds. */
export interface SymbolTradeLimits extends TokenTradeLimits {
  symbol: string; // UPPERCASE symbol, e.g. "BONK"
}

/**
 * Lists the per-token trade limits for every symbol the backend configures
 * (GET /v1/trade/limits). Powers a Platform-wide "all symbols" limits list; the
 * trade screen still gets its single-token bounds folded into the trade context.
 */
export class GetTradeLimitsUseCase {
  constructor(private readonly trade: TradeRepository) {}

  async execute(): Promise<Result<SymbolTradeLimits[]>> {
    const result = await this.trade.getLimits();
    if (!result.ok) return result;
    const list = Object.entries(result.data).map(([symbol, limits]) => ({
      symbol,
      ...limits,
    }));
    return ok(list);
  }
}
