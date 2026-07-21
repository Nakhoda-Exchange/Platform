import { describe, expect, test } from "bun:test";
import { PollOrderUseCase } from "./poll-order.use-case";
import type { TradeRepository } from "../ports/trade-repository.port";
import type {
  OrderStatus,
  OrderStatusView,
} from "@/lib/core/domain/trade/order";
import { fail, ok, type Result } from "@/lib/core/domain/shared/result";

/** A trade repo whose `getOrder` returns a scripted sequence of status reads. */
function repoWithStatuses(steps: Array<Result<OrderStatusView>>): {
  repo: TradeRepository;
  reads: () => number;
} {
  let i = 0;
  const repo = {
    getOrder: async (): Promise<Result<OrderStatusView>> => {
      const step = steps[Math.min(i, steps.length - 1)];
      i++;
      return step;
    },
  } as unknown as TradeRepository;
  return { repo, reads: () => i };
}

const view = (status: OrderStatus, extra: Partial<OrderStatusView> = {}) =>
  ok<OrderStatusView>({ orderId: "ord_1", status, ...extra });

// Instant sleep so the poll loop resolves without real timers.
const noSleep = async () => {};

describe("PollOrderUseCase", () => {
  test("202 → poll → SETTLED: resolves once the status turns terminal", async () => {
    const { repo, reads } = repoWithStatuses([
      view("RESERVED"),
      view("RESERVED"),
      view("SETTLED", { filledCoin: 0.5 }),
    ]);
    const result = await new PollOrderUseCase(repo).execute("ord_1", {
      maxAttempts: 10,
      sleep: noSleep,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("SETTLED");
      expect(result.data.order?.filledCoin).toBe(0.5);
    }
    // Stopped polling the moment it settled (3rd read), not the full budget.
    expect(reads()).toBe(3);
  });

  test("202 → poll → REJECTED: surfaces the terminal rejection + reason", async () => {
    const { repo } = repoWithStatuses([
      view("RESERVED"),
      view("REJECTED", { reason: "NO_LIQUIDITY" }),
    ]);
    const result = await new PollOrderUseCase(repo).execute("ord_1", {
      maxAttempts: 10,
      sleep: noSleep,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("REJECTED");
      expect(result.data.order?.reason).toBe("NO_LIQUIDITY");
    }
  });

  test("still resting when the budget elapses → TIMEOUT (hand off to open orders)", async () => {
    const { repo, reads } = repoWithStatuses([view("RESERVED")]);
    const result = await new PollOrderUseCase(repo).execute("ord_1", {
      maxAttempts: 3,
      sleep: noSleep,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("TIMEOUT");
      // The last-seen (non-terminal) view is carried for context.
      expect(result.data.order?.status).toBe("RESERVED");
    }
    expect(reads()).toBe(3);
  });

  test("a transient read failure does not abort the poll — it retries", async () => {
    const { repo } = repoWithStatuses([
      fail<OrderStatusView>("NETWORK", "بی‌ارتباط"),
      view("RESERVED"),
      view("SETTLED"),
    ]);
    const result = await new PollOrderUseCase(repo).execute("ord_1", {
      maxAttempts: 10,
      sleep: noSleep,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe("SETTLED");
  });
});
