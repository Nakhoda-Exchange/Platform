import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/market/overview — the market/discover view model for the CSR market
 * screen, as JSON. Mirrors what the former server page derived: the market
 * overview plus the viewer's held-coin symbols (whose rows swipe to SELL) and
 * their spendable Toman. The auth token is read server-side by the HTTP
 * interceptor, so this stays secure while the page renders on the client.
 */
export async function GET(): Promise<Response> {
  const [result, portfolioResult] = await Promise.all([
    container.resolve(TOKENS.GetMarketOverviewUseCase).execute(),
    container.resolve(TOKENS.GetPortfolioUseCase).execute(),
  ]);

  if (!result.ok) return respond(result);

  // Held coins are identified by UPPERCASE symbol, not coin id: the portfolio
  // keys assets by currency code (lower(symbol)) while the market keys coins by
  // an opaque id (e.g. "dx_<contract>" for discovered tokens). Symbol is the
  // stable cross-context key — matching on id misses every token holding.
  const heldSymbols = portfolioResult.ok
    ? portfolioResult.data.holdings
        .filter((h) => h.amount > 0)
        .map((h) => h.coin.symbol.toUpperCase())
    : [];
  const availableIrt = portfolioResult.ok
    ? portfolioResult.data.availableIrt
    : 0;

  return Response.json({ overview: result.data, heldSymbols, availableIrt });
}

// Prices move; never statically cached.
export const dynamic = "force-dynamic";
