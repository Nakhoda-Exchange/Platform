import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { FALLBACK_WALLET_CONFIG } from "@/lib/core/domain/wallet/wallet-config";

/**
 * GET /api/wallet/withdraw — the withdraw screen's view model for the CSR
 * wallet withdraw page, as JSON: the user's saved IBANs and cards, the
 * withdrawable Toman balance, and the withdraw config (minimum, fee, and whether
 * an OTP is required — issues #156/#154). The auth token is read server-side by
 * the HTTP interceptor.
 */
export async function GET(): Promise<Response> {
  const [ibans, cards, balances, config] = await Promise.all([
    container.resolve(TOKENS.ManageIbansUseCase).list(),
    container.resolve(TOKENS.ManageCardsUseCase).list(),
    container.resolve(TOKENS.WithdrawUseCase).balances(),
    container.resolve(TOKENS.GetWalletConfigUseCase).execute(),
  ]);

  const withdraw = config.ok
    ? config.data.withdraw
    : FALLBACK_WALLET_CONFIG.withdraw;

  return Response.json({
    ibans: ibans.ok ? ibans.data : [],
    cards: cards.ok ? cards.data : [],
    availableIrt: balances.ok ? balances.data.availableIrt : 0,
    minWithdrawIrt: withdraw.minIrt,
    feeBps: withdraw.feeBps,
    feeCapIrt: withdraw.feeCapIrt,
    otpRequired: withdraw.otpRequired,
  });
}

export const dynamic = "force-dynamic";
