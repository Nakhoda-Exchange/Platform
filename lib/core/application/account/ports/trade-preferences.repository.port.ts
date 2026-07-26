import type { TradePreferences } from "@/lib/core/domain/trade/preferences";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for the caller's trade preferences. */
export interface TradePreferencesRepository {
  get(): Promise<Result<TradePreferences>>;
  save(prefs: TradePreferences): Promise<Result<TradePreferences>>;
}
