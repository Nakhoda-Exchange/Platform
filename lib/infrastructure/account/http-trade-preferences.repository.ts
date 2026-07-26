import type { TradePreferencesRepository } from "@/lib/core/application/account/ports/trade-preferences.repository.port";
import type { TradePreferences } from "@/lib/core/domain/trade/preferences";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter. Backend: /v1/account/trade-preferences. */
export class HttpTradePreferencesRepository implements TradePreferencesRepository {
  constructor(private readonly http: HttpClient) {}

  get(): Promise<Result<TradePreferences>> {
    return this.http.get<TradePreferences>("/account/trade-preferences");
  }

  save(prefs: TradePreferences): Promise<Result<TradePreferences>> {
    return this.http.request<TradePreferences>({
      method: "PUT",
      path: "/account/trade-preferences",
      body: prefs as unknown as Record<string, unknown>,
    });
  }
}
