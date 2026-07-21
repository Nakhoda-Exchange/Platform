import { describe, expect, test } from "bun:test";
import { CancelOrderUseCase } from "./cancel-order.use-case";
import type { TradeRepository } from "../ports/trade-repository.port";
import { fail, ok, type Result } from "@/lib/core/domain/shared/result";

function repoWithCancel(result: Result<void>): {
  repo: TradeRepository;
  calls: () => string[];
} {
  const ids: string[] = [];
  const repo = {
    cancelOrder: async (orderId: string): Promise<Result<void>> => {
      ids.push(orderId);
      return result;
    },
  } as unknown as TradeRepository;
  return { repo, calls: () => ids };
}

describe("CancelOrderUseCase", () => {
  test("cancels an order via the repository", async () => {
    const { repo, calls } = repoWithCancel(ok(undefined));
    const result = await new CancelOrderUseCase(repo).execute("ord_1");
    expect(result.ok).toBe(true);
    expect(calls()).toEqual(["ord_1"]);
  });

  test("passes through the 409 «already executed» code untouched", async () => {
    const { repo } = repoWithCancel(
      fail<void>("ORDER_ALREADY_EXECUTED", "این سفارش پیش‌تر انجام شده است."),
    );
    const result = await new CancelOrderUseCase(repo).execute("ord_1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("ORDER_ALREADY_EXECUTED");
  });

  test("guards a blank order id without hitting the repository", async () => {
    const { repo, calls } = repoWithCancel(ok(undefined));
    const result = await new CancelOrderUseCase(repo).execute("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("EMPTY_ORDER_ID");
    expect(calls()).toEqual([]);
  });
});
