import type { CurrencyUnits } from "@/lib/core/domain/config/currency-units";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for platform configuration. Adapters live in infrastructure. */
export interface ConfigRepository {
  getCurrencyUnits(): Promise<Result<CurrencyUnits>>;
}
