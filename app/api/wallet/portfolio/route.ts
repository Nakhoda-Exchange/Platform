import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/wallet/portfolio — the wallet view model for the CSR wallet screen,
 * as JSON. Mirrors what the former server page derived: the portfolio, its
 * value history, and — only for a truly-empty account — a few blue-chip
 * suggestions (top market cap) for the deposit-first empty state. The auth
 * token is read server-side by the HTTP interceptor.
 */
export async function GET(): Promise<Response> {
  const [result, historyResult] = await Promise.all([
    container.resolve(TOKENS.GetPortfolioUseCase).execute(),
    container.resolve(TOKENS.GetPortfolioHistoryUseCase).execute(),
  ]);

  if (!result.ok) return respond(result);

  const portfolio = result.data;
  const history = historyResult.ok ? historyResult.data : null;

  // Only the truly-empty account (no coins, no cash, nothing pending) gets the
  // deposit-first screen with buy suggestions; everyone else sees their money.
  const hasNothing =
    portfolio.holdings.length === 0 &&
    portfolio.availableIrt <= 0 &&
    portfolio.pendingWithdrawIrt <= 0;

  let suggestions: unknown[] = [];
  if (hasNothing) {
    const coins = await container.resolve(TOKENS.ListCoinsUseCase).execute();
    suggestions = coins.ok
      ? [...coins.data].sort((a, b) => b.marketCap - a.marketCap).slice(0, 4)
      : [];
  }

  return Response.json({ portfolio, history, suggestions });
}

// Balances move; never statically cached.
export const dynamic = "force-dynamic";
