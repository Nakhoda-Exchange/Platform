import { MIN_WITHDRAW_IRT } from "@/lib/core/domain/wallet/withdraw";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import { toPersianDigits } from "@/lib/utils/digits";
import type { TradeRepository } from "@/lib/core/application/trade/ports/trade-repository.port";
import type { WalletRepository } from "../ports/wallet-repository.port";
import type { WalletConfigRepository } from "../ports/wallet-config-repository.port";

/**
 * Withdrawals — Toman to one of the user's IBANs (شبا). Guards here are
 * client-side UX; the backend re-validates authoritatively. The minimum comes
 * from the wallet config (issue #156), falling back to the hardcoded constant
 * only if the config is unreachable. When the backend requires a `withdraw` OTP
 * (issue #154) the code is threaded through to the request. The withdrawal
 * produces a PENDING transaction (a back-office approves real withdrawals).
 */
export class WithdrawUseCase {
  constructor(
    private readonly trade: TradeRepository,
    private readonly wallet: WalletRepository,
    private readonly config: WalletConfigRepository,
  ) {}

  /** The withdrawable balances (pass-through for the withdraw screens). */
  balances() {
    return this.trade.getBalances();
  }

  async irt(
    ibanId: string,
    amountIrt: number,
    otp?: string,
  ): Promise<Result<{ id: string }>> {
    if (!ibanId) return fail("NO_IBAN", "شبای مقصد را انتخاب کنید.");
    if (!Number.isFinite(amountIrt) || amountIrt <= 0) {
      return fail("EMPTY_AMOUNT", "مبلغ برداشت را وارد کنید.");
    }

    // Authoritative minimum from the backend config; fall back to the constant
    // only when the config can't be read.
    const cfg = await this.config.getWalletConfig();
    const minIrt = cfg.ok ? cfg.data.withdraw.minIrt : MIN_WITHDRAW_IRT;
    if (amountIrt < minIrt) {
      return fail(
        "BELOW_MIN_WITHDRAW",
        `کمینه برداشت ${toPersianDigits(minIrt.toLocaleString("en-US"))} تومان است.`,
      );
    }

    const balances = await this.trade.getBalances();
    if (!balances.ok) return balances;
    if (amountIrt > balances.data.availableIrt) {
      return fail("INSUFFICIENT_IRT", "موجودی تومانی شما کافی نیست.");
    }
    return this.wallet.requestIrtWithdraw(ibanId, amountIrt, otp);
  }
}
