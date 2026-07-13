import type { Result } from "@/lib/core/domain/shared/result";
import type { TokenInsights } from "@/lib/core/domain/insights/token-insights";
import type { Coin } from "@/lib/core/domain/market/coin";
import { fail } from "@/lib/core/domain/shared/result";
import type { TokenInsightsPort } from "../ports/insights.port";

/**
 * Fetches the normalized insights for a coin. Coins without an on-chain
 * identity (majors like BTC) have no meme-coin insights — the use case returns
 * a NOT_ONCHAIN failure the PDP renders as "not applicable", never a crash.
 * The USD→Toman rate is derived from the coin's own dual price so the price-
 * impact curve can label sizes in Toman.
 */
export class GetTokenInsightsUseCase {
  constructor(private readonly insights: TokenInsightsPort) {}

  execute(
    coin: Pick<Coin, "token" | "priceIrt" | "priceUsd">,
  ): Promise<Result<TokenInsights>> {
    if (!coin.token) {
      return Promise.resolve(
        fail("NOT_ONCHAIN", "این رمزارز داده‌ی زنجیره‌ای ندارد."),
      );
    }
    const usdToIrt = coin.priceUsd > 0 ? coin.priceIrt / coin.priceUsd : 0;
    return this.insights.getInsights(coin.token, usdToIrt);
  }
}
