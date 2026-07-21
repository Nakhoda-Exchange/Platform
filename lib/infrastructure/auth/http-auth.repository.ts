import type { AuthRepository } from "@/lib/core/application/auth/ports/auth-repository.port";
import type { AuthSession } from "@/lib/core/domain/auth/auth-session";
import type { Mobile } from "@/lib/core/domain/auth/mobile";
import type { OtpChallenge } from "@/lib/core/domain/auth/otp-challenge";
import type { OtpPurpose } from "@/lib/core/domain/auth/otp-purpose";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter for auth. Contract: doc/auth/api.md. */
export class HttpAuthRepository implements AuthRepository {
  constructor(private readonly http: HttpClient) {}

  requestOtp(
    mobile: Mobile,
    purpose?: OtpPurpose,
  ): Promise<Result<OtpChallenge>> {
    // Only send `purpose` when set, so the login request body stays `{ mobile }`.
    return this.http.post<OtpChallenge>("/auth/otp/request", {
      mobile: mobile.value,
      ...(purpose ? { purpose } : {}),
    });
  }

  verifyOtp(challengeId: string, code: string): Promise<Result<AuthSession>> {
    return this.http.post<AuthSession>("/auth/otp/verify", {
      challengeId,
      code,
    });
  }
}
