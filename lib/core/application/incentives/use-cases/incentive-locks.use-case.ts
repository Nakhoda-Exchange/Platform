import {
  NO_LOCKS,
  type ForfeitedLock,
  type IncentiveLocks,
} from "@/lib/core/domain/incentives/incentive-lock";
import type { Result } from "@/lib/core/domain/shared/result";
import type { IncentivesRepository } from "../ports/incentives-repository.port";

/**
 * The user's unvested gifts — what they were paid but cannot withdraw yet, and
 * how far they have come toward releasing it.
 */
export class IncentiveLocksUseCase {
  constructor(private readonly incentives: IncentivesRepository) {}

  /**
   * Never fails. A locked gift is a secondary concern on a screen about the
   * user's own money, and an incentives outage must not stop the withdraw page
   * from rendering. Reporting NO locks is also the safe direction: the backend
   * enforces the floor inside the reserve statement regardless of what this
   * screen believes, so the worst outcome is a rejected request the user did not
   * see coming — never money leaving that should have stayed.
   */
  async list(): Promise<IncentiveLocks> {
    const result = await this.incentives.locks();
    return result.ok ? result.data : NO_LOCKS;
  }

  forfeit(id: string): Promise<Result<ForfeitedLock>> {
    return this.incentives.forfeitLock(id);
  }
}
