import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import {
  isValidCardNumber,
  normalizeCardNumber,
} from "@/lib/core/domain/wallet/bank-card";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { WalletRepository } from "../ports/wallet-repository.port";

/** The user's saved cards + adding a new one (validated here). */
export class ManageCardsUseCase {
  constructor(private readonly wallet: WalletRepository) {}

  list(): Promise<Result<BankCard[]>> {
    return this.wallet.listCards();
  }

  add(number: string): Promise<Result<BankCard>> {
    const normalized = normalizeCardNumber(number);
    if (!normalized || !isValidCardNumber(normalized)) {
      return Promise.resolve(
        fail<BankCard>(
          "INVALID_CARD",
          "شماره کارت درست نیست. ۱۶ رقم کارت را بررسی کنید.",
        ),
      );
    }
    return this.wallet.addCard(normalized);
  }
}
