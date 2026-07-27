import type { IncentivesRepository } from "@/lib/core/application/incentives/ports/incentives-repository.port";
import type { RedeemedIncentive } from "@/lib/core/domain/incentives/incentive";
import type {
  ForfeitedLock,
  IncentiveLocks,
} from "@/lib/core/domain/incentives/incentive-lock";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter for incentive codes. Contract: doc/incentives/api.md. */
export class HttpIncentivesRepository implements IncentivesRepository {
  constructor(private readonly http: HttpClient) {}

  redeem(code: string): Promise<Result<RedeemedIncentive>> {
    return this.http.post<RedeemedIncentive>("/incentives/redeem", { code });
  }

  locks(): Promise<Result<IncentiveLocks>> {
    return this.http.get<IncentiveLocks>("/incentives/locks");
  }

  forfeitLock(id: string): Promise<Result<ForfeitedLock>> {
    return this.http.post<ForfeitedLock>(
      `/incentives/locks/${encodeURIComponent(id)}/forfeit`,
      {},
    );
  }
}
