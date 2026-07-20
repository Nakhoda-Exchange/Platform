import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";

/**
 * GET /api/wallet/withdraw — the withdraw screen's view model for the CSR
 * wallet withdraw page, as JSON: the user's saved IBANs and cards plus the
 * withdrawable Toman balance. The auth token is read server-side by the HTTP
 * interceptor.
 */
export async function GET(): Promise<Response> {
  const [ibans, cards, balances] = await Promise.all([
    container.resolve(TOKENS.ManageIbansUseCase).list(),
    container.resolve(TOKENS.ManageCardsUseCase).list(),
    container.resolve(TOKENS.WithdrawUseCase).balances(),
  ]);

  return Response.json({
    ibans: ibans.ok ? ibans.data : [],
    cards: cards.ok ? cards.data : [],
    availableIrt: balances.ok ? balances.data.availableIrt : 0,
  });
}

export const dynamic = "force-dynamic";
