import {
  MIN_DEPOSIT_IRT,
  type CardDeposit,
} from "@/lib/core/domain/wallet/deposit";
import type { DepositStatus } from "@/lib/core/domain/wallet/deposit";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { WalletRepository } from "../ports/wallet-repository.port";

/**
 * Card-to-card Toman deposit: validates and starts one (the response carries
 * the company's destination card), and polls its status until the backend
 * reports the transfer submitted.
 */
export class DepositIrtUseCase {
  constructor(private readonly wallet: WalletRepository) {}

  async start(cardId: string, amountIrt: number): Promise<Result<CardDeposit>> {
    if (!cardId) return fail("NO_CARD", "کارت خود را انتخاب کنید.");
    if (!Number.isFinite(amountIrt) || amountIrt <= 0) {
      return fail("EMPTY_AMOUNT", "مبلغ واریز را وارد کنید.");
    }
    if (amountIrt < MIN_DEPOSIT_IRT) {
      return fail("BELOW_MIN_DEPOSIT", "کمینه واریز ۱۰۰٬۰۰۰ تومان است.");
    }
    return this.wallet.initiateCardDeposit(cardId, amountIrt);
  }

  status(depositId: string): Promise<Result<DepositStatus>> {
    return this.wallet.getDepositStatus(depositId);
  }
}
