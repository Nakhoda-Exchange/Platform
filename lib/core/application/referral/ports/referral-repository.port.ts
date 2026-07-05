import type { Result } from "@/lib/core/domain/shared/result";

/** Raw referral facts from the backend; tiers are computed in the use case. */
export interface ReferralFacts {
  code: string;
  invitedCount: number;
  activeCount: number;
  earnedIrt: number;
}

/** Port for the referral program. Adapters live in infrastructure. */
export interface ReferralRepository {
  getFacts(): Promise<Result<ReferralFacts>>;
  /** Attribute this signup to an inviter's code (from ?ref= at login). */
  applyCode(code: string): Promise<Result<void>>;
}
