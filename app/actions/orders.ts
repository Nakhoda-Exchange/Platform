"use server";

import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import type { CancelOrderState } from "./orders-state";

/**
 * Cancels a resting order and releases its reserve. On success the row is
 * removed client-side; a 409 (the order already executed) comes back as
 * `alreadyExecuted` so the screen refreshes the list instead of erroring.
 */
export async function cancelOrder(orderId: string): Promise<CancelOrderState> {
  const result = await container
    .resolve(TOKENS.CancelOrderUseCase)
    .execute(orderId);

  if (result.ok) return { ok: true };
  return {
    ok: false,
    alreadyExecuted: result.error.code === "ORDER_ALREADY_EXECUTED",
    message: result.error.message,
  };
}
