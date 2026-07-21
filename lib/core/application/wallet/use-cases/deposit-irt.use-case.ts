import {
  MIN_DEPOSIT_IRT,
  type CardDeposit,
} from "@/lib/core/domain/wallet/deposit";
import type { DepositStatus } from "@/lib/core/domain/wallet/deposit";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import { toPersianDigits } from "@/lib/utils/digits";
import type { WalletRepository } from "../ports/wallet-repository.port";
import type { WalletConfigRepository } from "../ports/wallet-config-repository.port";

/**
 * Card-to-card Toman deposit: validates and starts one (the response carries
 * the company's destination card), and polls its status until the backend
 * reports the transfer submitted. The minimum comes from the wallet config
 * (issue #156), falling back to the hardcoded constant only if the config is
 * unreachable.
 */
export class DepositIrtUseCase {
  constructor(
    private readonly wallet: WalletRepository,
    private readonly config: WalletConfigRepository,
  ) {}

  async start(cardId: string, amountIrt: number): Promise<Result<CardDeposit>> {
    if (!cardId) return fail("NO_CARD", "کارت خود را انتخاب کنید.");
    if (!Number.isFinite(amountIrt) || amountIrt <= 0) {
      return fail("EMPTY_AMOUNT", "مبلغ واریز را وارد کنید.");
    }

    const cfg = await this.config.getWalletConfig();
    const minIrt = cfg.ok ? cfg.data.deposit.minIrt : MIN_DEPOSIT_IRT;
    if (amountIrt < minIrt) {
      return fail(
        "BELOW_MIN_DEPOSIT",
        `کمینه واریز ${toPersianDigits(minIrt.toLocaleString("en-US"))} تومان است.`,
      );
    }
    return this.wallet.initiateCardDeposit(cardId, amountIrt);
  }

  status(depositId: string): Promise<Result<DepositStatus>> {
    return this.wallet.getDepositStatus(depositId);
  }
}
