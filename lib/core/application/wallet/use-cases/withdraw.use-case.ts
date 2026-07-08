import { MIN_WITHDRAW_IRT } from "@/lib/core/domain/wallet/withdraw";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { TradeRepository } from "@/lib/core/application/trade/ports/trade-repository.port";
import type { WalletRepository } from "../ports/wallet-repository.port";

/**
 * Withdrawals — Toman to one of the user's IBANs (شبا). All guards live here
 * (authoritative); the withdrawal produces a PENDING transaction (a
 * back-office approves real withdrawals).
 */
export class WithdrawUseCase {
  constructor(
    private readonly trade: TradeRepository,
    private readonly wallet: WalletRepository,
  ) {}

  /** The withdrawable balances (pass-through for the withdraw screens). */
  balances() {
    return this.trade.getBalances();
  }

  async irt(
    ibanId: string,
    amountIrt: number,
  ): Promise<Result<{ id: string }>> {
    if (!ibanId) return fail("NO_IBAN", "شبای مقصد را انتخاب کنید.");
    if (!Number.isFinite(amountIrt) || amountIrt <= 0) {
      return fail("EMPTY_AMOUNT", "مبلغ برداشت را وارد کنید.");
    }
    if (amountIrt < MIN_WITHDRAW_IRT) {
      return fail("BELOW_MIN_WITHDRAW", "کمینه برداشت ۵۰۰٬۰۰۰ تومان است.");
    }
    const balances = await this.trade.getBalances();
    if (!balances.ok) return balances;
    if (amountIrt > balances.data.availableIrt) {
      return fail("INSUFFICIENT_IRT", "موجودی تومانی شما کافی نیست.");
    }
    return this.wallet.requestIrtWithdraw(ibanId, amountIrt);
  }
}
