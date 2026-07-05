import type {
  ReferralFacts,
  ReferralRepository,
} from "@/lib/core/application/referral/ports/referral-repository.port";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import { wallet } from "../portfolio/mock-wallet-state";

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The mock user's referral state (per-process). Earned rewards are derived
// from the reward transactions in the shared wallet — one source of truth.
const CODE = "ALI-1234";
let invitedCount = 3;
let activeCount = 2;

export class MockReferralRepository implements ReferralRepository {
  async getFacts(): Promise<Result<ReferralFacts>> {
    await delay();
    const earnedIrt = wallet.transactions
      .filter((t) => t.type === "reward")
      .reduce((sum, t) => sum + t.amountIrt, 0);
    return ok({ code: CODE, invitedCount, activeCount, earnedIrt });
  }

  async applyCode(code: string): Promise<Result<void>> {
    await delay(150);
    // Mock: any well-formed code counts as a new attribution for the demo.
    if (/^[A-Z]{2,8}-\d{3,6}$/.test(code)) {
      invitedCount += 1;
      activeCount += 1;
    }
    return ok(undefined);
  }
}
