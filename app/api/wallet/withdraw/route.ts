import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { FALLBACK_WALLET_CONFIG } from "@/lib/core/domain/wallet/wallet-config";

/**
 * GET /api/wallet/withdraw — the withdraw screen's view model for the CSR
 * wallet withdraw page, as JSON: the user's saved IBANs and cards, the
 * withdrawable Toman balance, any unvested incentive gifts holding part of it
 * back, and the withdraw config (minimum, fee, and whether an OTP is required —
 * issues #156/#154). The auth token is read server-side by the HTTP interceptor.
 */
export async function GET(): Promise<Response> {
  const [ibans, cards, balances, config, locks] = await Promise.all([
    container.resolve(TOKENS.ManageIbansUseCase).list(),
    container.resolve(TOKENS.ManageCardsUseCase).list(),
    container.resolve(TOKENS.WithdrawUseCase).balances(),
    container.resolve(TOKENS.GetWalletConfigUseCase).execute(),
    // Unvested gift money: spendable, but not yet cashable. Fetched here so the
    // form can net it out BEFORE the user types an amount the backend would
    // reject — a «موجودی کافی نیست» on a balance they can plainly see reads as
    // a bug. Never throws; an incentives outage degrades to "no locks".
    container.resolve(TOKENS.IncentiveLocksUseCase).list(),
  ]);

  const withdraw = config.ok
    ? config.data.withdraw
    : FALLBACK_WALLET_CONFIG.withdraw;

  return Response.json({
    ibans: ibans.ok ? ibans.data : [],
    cards: cards.ok ? cards.data : [],
    availableIrt: balances.ok ? balances.data.availableIrt : 0,
    lockedIrt: locks.lockedIrt,
    locks: locks.items,
    minWithdrawIrt: withdraw.minIrt,
    feeBps: withdraw.feeBps,
    feeCapIrt: withdraw.feeCapIrt,
    otpRequired: withdraw.otpRequired,
  });
}

export const dynamic = "force-dynamic";
