import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { TradeRepository } from "../ports/trade-repository.port";

/**
 * Cancels a resting order and releases its reserve. A blank id is a programming
 * error, guarded here; the "already executed" race (backend 409) surfaces as the
 * stable `ORDER_ALREADY_EXECUTED` code the adapter maps, so the UI can refresh
 * the list instead of showing a generic error.
 */
export class CancelOrderUseCase {
  constructor(private readonly trade: TradeRepository) {}

  execute(orderId: string): Promise<Result<void>> {
    if (!orderId) {
      return Promise.resolve(
        fail("EMPTY_ORDER_ID", "شناسه سفارش نامعتبر است."),
      );
    }
    return this.trade.cancelOrder(orderId);
  }
}
