import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";

/**
 * GET /api/wallet/deposit — the deposit screen's view model for the CSR wallet
 * deposit page, as JSON: the current spendable Toman balance (a zero balance
 * greets a first deposit) plus the user's saved cards. The auth token is read
 * server-side by the HTTP interceptor.
 */
export async function GET(): Promise<Response> {
  const [portfolio, cards] = await Promise.all([
    container.resolve(TOKENS.GetPortfolioUseCase).execute(),
    container.resolve(TOKENS.ManageCardsUseCase).list(),
  ]);

  const availableIrt = portfolio.ok ? portfolio.data.availableIrt : 0;

  return Response.json({
    availableIrt,
    cards: cards.ok ? cards.data : [],
  });
}

export const dynamic = "force-dynamic";
