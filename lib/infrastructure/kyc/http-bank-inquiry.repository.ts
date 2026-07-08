import type {
  BankInquiryPort,
  BankInquiryResult,
} from "@/lib/core/application/kyc/ports/bank-inquiry.port";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter for the KYC ownership inquiry. Contract: doc/kyc/api.md. */
export class HttpBankInquiryRepository implements BankInquiryPort {
  constructor(private readonly http: HttpClient) {}

  verifyCard(number: string): Promise<Result<BankInquiryResult>> {
    return this.http.post<BankInquiryResult>("/kyc/card-inquiry", { number });
  }

  verifyIban(value: string): Promise<Result<BankInquiryResult>> {
    return this.http.post<BankInquiryResult>("/kyc/iban-inquiry", {
      iban: value,
    });
  }
}
