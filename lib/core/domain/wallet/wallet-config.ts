import { MIN_DEPOSIT_IRT } from "./deposit";
import { MIN_WITHDRAW_IRT } from "./withdraw";

/**
 * Deposit + withdrawal configuration served by the backend
 * (`GET /v1/wallet/config`) — the platform no longer hardcodes minimums or the
 * withdrawal fee (issue #156). Money fields arrive as exact decimal STRINGS on
 * the wire (parsed to numbers in the HTTP adapter); `feeBps` is a plain
 * basis-point number and `otpRequired` a boolean.
 */
export interface WalletConfig {
  deposit: {
    /** Smallest Toman deposit the backend accepts. */
    minIrt: number;
  };
  withdraw: {
    /** Smallest Toman withdrawal the backend accepts. */
    minIrt: number;
    /**
     * Withdrawal fee rate in basis points (1 bps = 0.01%). The effective fee is
     * `min(amount × feeBps / 10000, feeCapIrt)`, deducted NET server-side.
     */
    feeBps: number;
    /** Maximum withdrawal fee in Toman — the rate-based fee is capped here. */
    feeCapIrt: number;
    /** Whether a purpose-bound `withdraw` OTP is required to withdraw. */
    otpRequired: boolean;
  };
}

/**
 * Last-resort defaults used only when the backend config is unreachable, so the
 * forms still guard sensibly instead of accepting any amount. The authoritative
 * values always come from `GET /v1/wallet/config`.
 */
export const FALLBACK_WALLET_CONFIG: WalletConfig = {
  deposit: { minIrt: MIN_DEPOSIT_IRT },
  withdraw: {
    minIrt: MIN_WITHDRAW_IRT,
    feeBps: 0,
    feeCapIrt: 0,
    otpRequired: false,
  },
};

/**
 * The withdrawal fee to DISPLAY for a given amount: `min(amount × feeBps /
 * 10000, feeCapIrt)`. This mirrors the server formula so the user sees the real
 * fee, but it is display-only — the authoritative fee is computed server-side
 * and deducted NET from the withdrawal.
 */
export function computeWithdrawFee(
  amountIrt: number,
  feeBps: number,
  feeCapIrt: number,
): number {
  if (!Number.isFinite(amountIrt) || amountIrt <= 0) return 0;
  const rate = (amountIrt * feeBps) / 10_000;
  const capped = feeCapIrt > 0 ? Math.min(rate, feeCapIrt) : rate;
  return Math.max(0, capped);
}
