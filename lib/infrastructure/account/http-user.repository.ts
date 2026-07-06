import type { UserRepository } from "@/lib/core/application/account/ports/user-repository.port";
import type { UserProfile } from "@/lib/core/domain/account/profile";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter for the account profile. Contract: doc/account/api.md. */
export class HttpUserRepository implements UserRepository {
  constructor(private readonly http: HttpClient) {}

  getProfile(): Promise<Result<UserProfile>> {
    return this.http.get<UserProfile>("/account/profile");
  }

  setTwoStepPassword(password: string): Promise<Result<UserProfile>> {
    return this.http.request<UserProfile>({
      method: "PUT",
      path: "/account/two-step-password",
      body: { password },
    });
  }

  verifyTwoStepPassword(password: string): Promise<Result<void>> {
    return this.http.post<void>("/account/two-step-password/verify", {
      password,
    });
  }
}
