import type {
  BankInquiryPort,
  BankInquiryResult,
} from "@/lib/core/application/kyc/ports/bank-inquiry.port";
import { sameOwner } from "@/lib/core/domain/wallet/bank-account";
import { fail, ok, type Result } from "@/lib/core/domain/shared/result";

function delay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ponytail: mirrors MockUserRepository's KYC'd profile name — the mock stands in
// for the whole Shaparak/Sheba-vs-national-code match, so it needs the holder.
const ACCOUNT_HOLDER = "علی رضایی";
const SOMEONE_ELSE = "زهرا محمدی";

// The mock can't really inquire, so it fakes a registered owner: any instrument
// whose digits end in 0000 is treated as belonging to someone else (documented
// in doc/kyc/api.md), which exercises the NOT_OWNER path. Everything else
// resolves to the account holder.
function registeredOwner(digits: string): string {
  return digits.endsWith("0000") ? SOMEONE_ELSE : ACCOUNT_HOLDER;
}

function verify(
  digits: string,
  kind: "card" | "iban",
): Result<BankInquiryResult> {
  const ownerName = registeredOwner(digits);
  if (!sameOwner(ownerName, ACCOUNT_HOLDER)) {
    const label = kind === "card" ? "کارت" : "شبا";
    return fail(
      "NOT_OWNER",
      `این ${label} به نام شما نیست. فقط حساب‌های به نام خودتان را می‌توانید اضافه کنید.`,
    );
  }
  return ok({ ownerName });
}

/**
 * In-memory ownership inquiry. Confirms a card/IBAN belongs to the KYC'd user.
 * Swap for an HTTP adapter in the composition root when the backend lands.
 */
export class MockBankInquiryRepository implements BankInquiryPort {
  async verifyCard(number: string): Promise<Result<BankInquiryResult>> {
    await delay();
    return verify(number, "card");
  }

  async verifyIban(value: string): Promise<Result<BankInquiryResult>> {
    await delay();
    // Compare on the digits only (drop the "IR" prefix).
    return verify(value.replace(/\D/g, ""), "iban");
  }
}
