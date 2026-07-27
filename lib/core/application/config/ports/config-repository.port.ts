import type { CurrencyUnits } from "@/lib/core/domain/config/currency-units";
import type { SignupConfig } from "@/lib/core/domain/config/signup-config";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for platform configuration. Adapters live in infrastructure. */
export interface ConfigRepository {
  getCurrencyUnits(): Promise<Result<CurrencyUnits>>;
  /** Whether registration currently requires an invite code. */
  getSignupConfig(): Promise<Result<SignupConfig>>;
}
