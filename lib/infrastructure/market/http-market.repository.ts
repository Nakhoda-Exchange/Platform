import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { Coin } from "@/lib/core/domain/market/coin";
import type {
  Candle,
  ChartRange,
  CoinChart,
  CoinDetail,
  PricePoint,
} from "@/lib/core/domain/market/coin-detail";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/**
 * The coin-detail as it comes off the wire (CoinDetailSchema): `series`/`candles`
 * are FLAT arrays for the default 24h range only — not the range-keyed records
 * the PDP chart consumes. The adapter reshapes them below.
 */
interface CoinDetailDto extends Omit<CoinDetail, "series" | "candles"> {
  series?: PricePoint[];
  candles?: Candle[];
}

/** HTTP adapter for market data. Contract: doc/market/api.md. */
export class HttpMarketRepository implements MarketRepository {
  constructor(private readonly http: HttpClient) {}

  listCoins(): Promise<Result<Coin[]>> {
    return this.http.get<Coin[]>("/market/coins");
  }

  async getCoinDetail(idOrSymbol: string): Promise<Result<CoinDetail | null>> {
    const result = await this.http.get<CoinDetailDto>(
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
    if (!result.ok) return result;

    // The backend serves flat 24h-only `series`/`candles`; the PDP chart reads
    // them per range (`series?.["24h"]`). Key the flat arrays under "24h" so the
    // 24h chart renders — indexing a flat array by "24h" would yield undefined,
    // collapsing every range to the empty state. Other ranges stay absent until
    // the timeframe endpoint (GET /v1/market/coins/{id}/chart) is wired.
    const { series, candles, ...rest } = result.data;
    return ok({
      ...rest,
      ...(series && series.length > 0
        ? { series: { "24h": series } as Record<ChartRange, PricePoint[]> }
        : {}),
      ...(candles && candles.length > 0
        ? { candles: { "24h": candles } as Record<ChartRange, Candle[]> }
        : {}),
    });
  }

  async getCoinChart(
    idOrSymbol: string,
    range: ChartRange,
  ): Promise<Result<CoinChart | null>> {
    const result = await this.http.get<{
      series?: PricePoint[];
      candles?: Candle[];
    }>(
      `/market/coins/${encodeURIComponent(idOrSymbol.toLowerCase())}/chart?timeframe=${range}`,
    );
    if (
      !result.ok &&
      (result.error.code === "COIN_NOT_FOUND" ||
        result.error.code === "HTTP_404")
    ) {
      return ok(null);
    }
    if (!result.ok) return result;
    // Guard sparse payloads: a coin with no history for this range returns
    // empty arrays (never null fields), which the PDP renders as a clear
    // "no data for this range yet" state rather than a broken chart.
    return ok({
      series: result.data.series ?? [],
      candles: result.data.candles ?? [],
    });
  }
}
