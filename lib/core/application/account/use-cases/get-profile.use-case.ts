import type { UserProfile } from "@/lib/core/domain/account/profile";
import type { Result } from "@/lib/core/domain/shared/result";
import type { UserRepository } from "../ports/user-repository.port";

/** Loads the account hub's profile. */
export class GetProfileUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(): Promise<Result<UserProfile>> {
    return this.users.getProfile();
  }
}
