import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { Coin } from "@/lib/core/domain/market/coin";
import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter for market data. Contract: doc/market/api.md. */
export class HttpMarketRepository implements MarketRepository {
  constructor(private readonly http: HttpClient) {}

  listCoins(): Promise<Result<Coin[]>> {
    return this.http.get<Coin[]>("/market/coins");
  }

  async getCoinDetail(idOrSymbol: string): Promise<Result<CoinDetail | null>> {
    const result = await this.http.get<CoinDetail>(
      `/market/coins/${encodeURIComponent(idOrSymbol.toLowerCase())}`,
    );
    // The port maps "unknown coin" to null (the page shows not-found). The
    // backend sends a domain code (COIN_NOT_FOUND) on 404; the client only
    // falls back to HTTP_404 when there's no code, so accept either.
    if (
      !result.ok &&
      (result.error.code === "COIN_NOT_FOUND" ||
        result.error.code === "HTTP_404")
    ) {
      return ok(null);
    }
    return result;
  }
}
