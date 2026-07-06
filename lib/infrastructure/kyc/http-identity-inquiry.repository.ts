import type { IdentityInquiryPort } from "@/lib/core/application/kyc/ports/identity-inquiry.port";
import type { Identity } from "@/lib/core/domain/kyc/identity";
import type { JalaliDate } from "@/lib/core/domain/kyc/jalali-date";
import type { NationalCode } from "@/lib/core/domain/kyc/national-code";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter for the identity inquiry. Contract: doc/kyc/api.md. */
export class HttpIdentityInquiryRepository implements IdentityInquiryPort {
  constructor(private readonly http: HttpClient) {}

  inquire(
    nationalCode: NationalCode,
    birthDate: JalaliDate,
  ): Promise<Result<Identity>> {
    return this.http.post<Identity>("/kyc/identity-inquiry", {
      nationalCode: nationalCode.value,
      birthDate: birthDate.value, // Jalali YYYY/MM/DD, Latin digits
    });
  }
}
