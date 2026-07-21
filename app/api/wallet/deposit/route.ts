import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { FALLBACK_WALLET_CONFIG } from "@/lib/core/domain/wallet/wallet-config";

/**
 * GET /api/wallet/deposit — the deposit screen's view model for the CSR wallet
 * deposit page, as JSON: the current spendable Toman balance (a zero balance
 * greets a first deposit), the user's saved cards, and the minimum deposit from
 * the wallet config (issue #156). The auth token is read server-side by the HTTP
 * interceptor.
 */
export async function GET(): Promise<Response> {
  const [portfolio, cards, config] = await Promise.all([
    container.resolve(TOKENS.GetPortfolioUseCase).execute(),
    container.resolve(TOKENS.ManageCardsUseCase).list(),
    container.resolve(TOKENS.GetWalletConfigUseCase).execute(),
  ]);

  const availableIrt = portfolio.ok ? portfolio.data.availableIrt : 0;
  const minDepositIrt = config.ok
    ? config.data.deposit.minIrt
    : FALLBACK_WALLET_CONFIG.deposit.minIrt;

  return Response.json({
    availableIrt,
    cards: cards.ok ? cards.data : [],
    minDepositIrt,
  });
}

export const dynamic = "force-dynamic";
