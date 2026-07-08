import type { Iban } from "@/lib/core/domain/wallet/bank-account";
import {
  isValidIban,
  normalizeIban,
} from "@/lib/core/domain/wallet/bank-account";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { WalletRepository } from "../ports/wallet-repository.port";
import type { BankInquiryPort } from "@/lib/core/application/kyc/ports/bank-inquiry.port";

/** The user's saved IBANs (شبا): list, add (validated + ownership-checked), set primary, remove. */
export class ManageIbansUseCase {
  constructor(
    private readonly wallet: WalletRepository,
    private readonly inquiry: BankInquiryPort,
  ) {}

  list(): Promise<Result<Iban[]>> {
    return this.wallet.listIbans();
  }

  async add(value: string): Promise<Result<Iban>> {
    const normalized = normalizeIban(value);
    if (!normalized || !isValidIban(normalized)) {
      return fail<Iban>(
        "INVALID_IBAN",
        "شماره شبا درست نیست. «IR» به‌همراه ۲۴ رقم را بررسی کنید.",
      );
    }
    // KYC ownership gate: the IBAN must belong to the signed-in user.
    const owner = await this.inquiry.verifyIban(normalized);
    if (!owner.ok) return owner;
    return this.wallet.addIban(normalized, owner.data.ownerName);
  }

  setPrimary(id: string): Promise<Result<void>> {
    return this.wallet.setPrimaryIban(id);
  }

  remove(id: string): Promise<Result<void>> {
    return this.wallet.removeIban(id);
  }
}
