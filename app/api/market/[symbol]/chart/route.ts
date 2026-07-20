import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";
import {
  CHART_RANGES,
  type ChartRange,
} from "@/lib/core/domain/market/coin-detail";

/**
 * GET /api/market/[symbol]/chart?timeframe=24h|7d|1m|1y — one range's chart data
 * (line + candles) for the PDP's fetch-on-range-toggle. Proxies the backend
 * `/v1/market/coins/{id}/chart` through the server-side BFF (keeps API base URL
 * + auth token off the client). An unknown coin is a 404; an unknown timeframe
 * falls back to 24h so a bad query never 500s.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
): Promise<Response> {
  const { symbol } = await params;
  const requested = new URL(request.url).searchParams.get("timeframe");
  const range: ChartRange = CHART_RANGES.includes(requested as ChartRange)
    ? (requested as ChartRange)
    : "24h";

  const result = await container
    .resolve(TOKENS.GetCoinChartUseCase)
    .execute(symbol, range);

  if (!result.ok) return respond(result);
  if (!result.data) {
    return Response.json(
      { code: "NOT_FOUND", message: "این رمزارز پیدا نشد." },
      { status: 404 },
    );
  }
  return Response.json({ range, ...result.data });
}

export const dynamic = "force-dynamic";
