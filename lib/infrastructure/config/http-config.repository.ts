import type { ConfigRepository } from "@/lib/core/application/config/ports/config-repository.port";
import type { CurrencyUnits } from "@/lib/core/domain/config/currency-units";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter for platform config. Contract: doc/config/api.md. */
export class HttpConfigRepository implements ConfigRepository {
  constructor(private readonly http: HttpClient) {}

  getCurrencyUnits(): Promise<Result<CurrencyUnits>> {
    return this.http.get<CurrencyUnits>("/config/currency-units");
  }
}
