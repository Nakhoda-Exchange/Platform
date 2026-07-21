import type { OpenOrder } from "@/lib/core/domain/trade/order";
import type { Result } from "@/lib/core/domain/shared/result";
import type { TradeRepository } from "../ports/trade-repository.port";

/** Lists the user's resting (open) orders — limit orders + anything still pending. */
export class ListOpenOrdersUseCase {
  constructor(private readonly trade: TradeRepository) {}

  execute(): Promise<Result<OpenOrder[]>> {
    return this.trade.listOpenOrders();
  }
}
