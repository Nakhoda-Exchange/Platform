import type { AuthRepository } from "@/lib/core/application/auth/ports/auth-repository.port";
import type { AuthSession } from "@/lib/core/domain/auth/auth-session";
import type { Mobile } from "@/lib/core/domain/auth/mobile";
import type {
  OtpBinding,
  OtpChallenge,
} from "@/lib/core/domain/auth/otp-challenge";
import type { OtpPurpose } from "@/lib/core/domain/auth/otp-purpose";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter for auth. Contract: doc/auth/api.md. */
export class HttpAuthRepository implements AuthRepository {
  constructor(private readonly http: HttpClient) {}

  requestOtp(
    mobile: Mobile,
    purpose?: OtpPurpose,
    binding?: OtpBinding,
  ): Promise<Result<OtpChallenge>> {
    // Only send `purpose`/`binding` when set, so the login request body stays
    // `{ mobile }`. When present, `binding` (e.g. `{ amountIrt, ibanId }`) is
    // stored on the challenge server-side and re-checked at verify (issue #154).
    return this.http.post<OtpChallenge>("/auth/otp/request", {
      mobile: mobile.value,
      ...(purpose ? { purpose } : {}),
      ...(binding ? { binding } : {}),
    });
  }

  verifyOtp(challengeId: string, code: string): Promise<Result<AuthSession>> {
    return this.http.post<AuthSession>("/auth/otp/verify", {
      challengeId,
      code,
    });
  }
}
