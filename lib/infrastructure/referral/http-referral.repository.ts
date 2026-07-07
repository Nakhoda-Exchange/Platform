import type {
  ReferralFacts,
  ReferralRepository,
} from "@/lib/core/application/referral/ports/referral-repository.port";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter for the referral program. Contract: doc/referral/api.md. */
export class HttpReferralRepository implements ReferralRepository {
  constructor(private readonly http: HttpClient) {}

  getFacts(): Promise<Result<ReferralFacts>> {
    return this.http.get<ReferralFacts>("/referral/facts");
  }

  applyCode(code: string): Promise<Result<void>> {
    return this.http.post<void>("/referral/apply", { code });
  }
}
