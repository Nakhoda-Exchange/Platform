import type { Result } from "@/lib/core/domain/shared/result";
import type { Invitee } from "@/lib/core/domain/referral/referral";

/** Raw referral facts from the backend; tiers are computed in the use case. */
export interface ReferralFacts {
  code: string;
  invitedCount: number;
  activeCount: number;
  earnedIrt: string; // lifetime rewards, Toman (decimal string on the wire)
  invitees: Invitee[];
}

/** Port for the referral program. Adapters live in infrastructure. */
export interface ReferralRepository {
  getFacts(): Promise<Result<ReferralFacts>>;
  /** Attribute this signup to an inviter's code (from ?ref= at login). */
  applyCode(code: string): Promise<Result<void>>;
}
