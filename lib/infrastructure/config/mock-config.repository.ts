import type { ConfigRepository } from "@/lib/core/application/config/ports/config-repository.port";
import type { CurrencyUnits } from "@/lib/core/domain/config/currency-units";
import { ok, type Result } from "@/lib/core/domain/shared/result";

// THE single place currency units are defined until the backend serves them.
const UNITS: CurrencyUnits = {
  irt: "تومان",
  usd: "دلار",
};

export class MockConfigRepository implements ConfigRepository {
  async getCurrencyUnits(): Promise<Result<CurrencyUnits>> {
    return ok(UNITS);
  }
}
