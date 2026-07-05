import {
  tierFor,
  type ReferralOverview,
} from "@/lib/core/domain/referral/referral";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { ReferralRepository } from "../ports/referral-repository.port";

/** The referral screen's data: backend facts + the tier math (domain). */
export class GetReferralOverviewUseCase {
  constructor(private readonly referral: ReferralRepository) {}

  async execute(): Promise<Result<ReferralOverview>> {
    const facts = await this.referral.getFacts();
    if (!facts.ok) return facts;
    const { current, next } = tierFor(facts.data.activeCount);
    return ok({
      ...facts.data,
      sharePercent: current.sharePercent,
      nextTier: next,
    });
  }

  applyCode(code: string): Promise<Result<void>> {
    return this.referral.applyCode(code.trim().toUpperCase());
  }
}
