import type { Result } from "@/lib/core/domain/shared/result";

/** What the banking-network inquiry tells us about an instrument's holder. */
export interface BankInquiryResult {
  /** Registered account holder, as the bank has it. */
  ownerName: string;
}

/**
 * KYC ownership inquiry against the banking network — Shaparak for cards, the
 * Sheba service for IBANs. It confirms the instrument belongs to the signed-in,
 * KYC-verified user; adapters fail with code `NOT_OWNER` when it doesn't.
 * Mocked until the backend lands (see lib/infrastructure/kyc); swap the adapter
 * in the composition root.
 */
export interface BankInquiryPort {
  verifyCard(number: string): Promise<Result<BankInquiryResult>>;
  verifyIban(value: string): Promise<Result<BankInquiryResult>>;
}
