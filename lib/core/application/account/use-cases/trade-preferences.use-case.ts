import type { TradePreferencesRepository } from "../ports/trade-preferences.repository.port";
import type { TradePreferences } from "@/lib/core/domain/trade/preferences";
import type { Result } from "@/lib/core/domain/shared/result";

export class GetTradePreferencesUseCase {
  constructor(private readonly repo: TradePreferencesRepository) {}
  execute(): Promise<Result<TradePreferences>> {
    return this.repo.get();
  }
}

export class SaveTradePreferencesUseCase {
  constructor(private readonly repo: TradePreferencesRepository) {}
  execute(prefs: TradePreferences): Promise<Result<TradePreferences>> {
    return this.repo.save(prefs);
  }
}
