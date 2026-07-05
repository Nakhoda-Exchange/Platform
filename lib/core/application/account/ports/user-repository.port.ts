import type { UserProfile } from "@/lib/core/domain/account/profile";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for the signed-in user's account data. */
export interface UserRepository {
  getProfile(): Promise<Result<UserProfile>>;
  /** Turn two-step verification on/off (code verification happens in the use case). */
  setTwoFactor(enabled: boolean): Promise<Result<UserProfile>>;
}
