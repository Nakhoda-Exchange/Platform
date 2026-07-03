import type { Identity } from "@/lib/core/domain/kyc/identity";
import type { NationalCode } from "@/lib/core/domain/kyc/national-code";
import type { JalaliDate } from "@/lib/core/domain/kyc/jalali-date";
import type { Result } from "@/lib/core/domain/shared/result";

/**
 * Port for the government identity inquiry (Shahkar-style). The application
 * layer depends only on this; the concrete adapter lives in infrastructure.
 */
export interface IdentityInquiryPort {
  /** Resolve the registered identity for a national code + birth date. */
  inquire(
    nationalCode: NationalCode,
    birthDate: JalaliDate,
  ): Promise<Result<Identity>>;
}
