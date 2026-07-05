import type { UserProfile } from "@/lib/core/domain/account/profile";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for the signed-in user's account data. */
export interface UserRepository {
  getProfile(): Promise<Result<UserProfile>>;
  /**
   * Set (or replace) the two-step password. Strength rules are enforced in
   * the use case; having a password set is what makes 2FA "enabled".
   */
  setTwoStepPassword(password: string): Promise<Result<UserProfile>>;
  /** Check a two-step password at the login gate; fails when it doesn't match. */
  verifyTwoStepPassword(password: string): Promise<Result<void>>;
}
