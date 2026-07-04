import type { UserProfile } from "@/lib/core/domain/account/profile";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for the signed-in user's account data. */
export interface UserRepository {
  getProfile(): Promise<Result<UserProfile>>;
}
