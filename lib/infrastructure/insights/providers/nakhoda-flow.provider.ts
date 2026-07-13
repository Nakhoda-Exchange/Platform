import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { TokenIdentity } from "@/lib/core/domain/shared/token-identity";
import type {
  NakhodaFlowProvider,
  NakhodaFlowSnapshot,
} from "@/lib/core/application/insights/ports/insights.port";

/**
 * Our own order-flow metrics — nobody else has these. Seeded/deterministic for
 * now (per the approved plan), keyed off the token address so a coin's values
 * are stable. ponytail: swap the body to read the portfolio/trade/watchlist
 * repos once they're backed by the real backend — the shape stays the same.
 */
function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}
function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export class SeededNakhodaFlowProvider implements NakhodaFlowProvider {
  async getNakhodaFlow(
    token: TokenIdentity,
  ): Promise<Result<NakhodaFlowSnapshot>> {
    const h = hash(token.address);
    return ok({
      source: "nakhoda",
      fetchedAt: Date.now(),
      flow: {
        holdersInProfitPercent: 30 + (h % 50), // 30–79%
        buySellRatio: round(0.6 + (h % 190) / 100, 2), // 0.6–2.5
        watchlistVelocityPerHour: h % 45,
      },
    });
  }
}
