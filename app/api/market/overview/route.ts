import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/market/overview — the market/discover view model for the CSR market
 * screen, as JSON. Mirrors what the former server page derived: the market
 * overview plus the viewer's held-coin ids (whose rows swipe to SELL) and their
 * spendable Toman. The auth token is read server-side by the HTTP interceptor,
 * so this stays secure while the page renders on the client.
 */
export async function GET(): Promise<Response> {
  const [result, portfolioResult] = await Promise.all([
    container.resolve(TOKENS.GetMarketOverviewUseCase).execute(),
    container.resolve(TOKENS.GetPortfolioUseCase).execute(),
  ]);

  if (!result.ok) return respond(result);

  const heldIds = portfolioResult.ok
    ? portfolioResult.data.holdings
        .filter((h) => h.amount > 0)
        .map((h) => h.coin.id)
    : [];
  const availableIrt = portfolioResult.ok
    ? portfolioResult.data.availableIrt
    : 0;

  return Response.json({ overview: result.data, heldIds, availableIrt });
}

// Prices move; never statically cached.
export const dynamic = "force-dynamic";
