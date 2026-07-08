import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import {
  isValidCardNumber,
  normalizeCardNumber,
} from "@/lib/core/domain/wallet/bank-card";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { WalletRepository } from "../ports/wallet-repository.port";
import type { BankInquiryPort } from "@/lib/core/application/kyc/ports/bank-inquiry.port";

/** The user's saved cards: list, add (validated + ownership-checked), set primary, remove. */
export class ManageCardsUseCase {
  constructor(
    private readonly wallet: WalletRepository,
    private readonly inquiry: BankInquiryPort,
  ) {}

  list(): Promise<Result<BankCard[]>> {
    return this.wallet.listCards();
  }

  async add(number: string): Promise<Result<BankCard>> {
    const normalized = normalizeCardNumber(number);
    if (!normalized || !isValidCardNumber(normalized)) {
      return fail<BankCard>(
        "INVALID_CARD",
        "شماره کارت درست نیست. ۱۶ رقم کارت را بررسی کنید.",
      );
    }
    // KYC ownership gate: the card must belong to the signed-in user.
    const owner = await this.inquiry.verifyCard(normalized);
    if (!owner.ok) return owner;
    return this.wallet.addCard(normalized, owner.data.ownerName);
  }

  setPrimary(id: string): Promise<Result<void>> {
    return this.wallet.setPrimaryCard(id);
  }

  remove(id: string): Promise<Result<void>> {
    return this.wallet.removeCard(id);
  }
}
