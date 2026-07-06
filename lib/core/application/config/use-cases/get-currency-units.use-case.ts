import type { CurrencyUnits } from "@/lib/core/domain/config/currency-units";
import type { Result } from "@/lib/core/domain/shared/result";
import type { ConfigRepository } from "../ports/config-repository.port";

/** Loads the currency unit labels the whole UI renders with. */
export class GetCurrencyUnitsUseCase {
  constructor(private readonly config: ConfigRepository) {}

  execute(): Promise<Result<CurrencyUnits>> {
    return this.config.getCurrencyUnits();
  }
}
