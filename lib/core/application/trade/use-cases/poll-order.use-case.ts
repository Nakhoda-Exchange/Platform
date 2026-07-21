import {
  isTerminalStatus,
  type OrderStatus,
  type OrderStatusView,
} from "@/lib/core/domain/trade/order";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { TradeRepository } from "../ports/trade-repository.port";

/** Default poll cadence: ~1s between reads, bounded so a resting order hands off. */
const DEFAULT_INTERVAL_MS = 1000;
const DEFAULT_MAX_ATTEMPTS = 12;

/**
 * The end of a poll: a terminal status (SETTLED / REJECTED / CANCELLED) with the
 * resolved order, or `TIMEOUT` when the poll budget elapsed while the order was
 * still RESERVED (resting). `TIMEOUT` is not an error — the order is safe in the
 * open-orders list; the UI hands the user off there.
 */
export interface PollOutcome {
  status: OrderStatus | "TIMEOUT";
  order: OrderStatusView | null;
}

export interface PollOptions {
  intervalMs?: number;
  maxAttempts?: number;
  /** Injected for tests; defaults to a real setTimeout-backed sleep. */
  sleep?: (ms: number) => Promise<void>;
}

const realSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Polls `GET /orders/{orderId}` until the order reaches a terminal status or the
 * budget (interval × maxAttempts) runs out. Resilient by design: a failed read
 * (network/transient) doesn't abort — it just counts as an attempt and retries,
 * because the order is not lost (it lives in the open-orders list). Used to
 * resolve a 202 ACCEPTED submission to its fill/rejection.
 */
export class PollOrderUseCase {
  constructor(private readonly trade: TradeRepository) {}

  async execute(
    orderId: string,
    options: PollOptions = {},
  ): Promise<Result<PollOutcome>> {
    const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
    const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    const sleep = options.sleep ?? realSleep;

    let last: OrderStatusView | null = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.trade.getOrder(orderId);
      if (result.ok) {
        last = result.data;
        if (isTerminalStatus(result.data.status)) {
          return ok({ status: result.data.status, order: result.data });
        }
      }
      // Still resting (RESERVED) or a transient read failure — wait and retry,
      // except after the final attempt (no point sleeping before giving up).
      if (attempt < maxAttempts - 1) await sleep(intervalMs);
    }

    return ok({ status: "TIMEOUT", order: last });
  }
}
