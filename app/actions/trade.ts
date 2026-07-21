"use server";

import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import type { OrderType } from "@/lib/core/domain/trade/order";
import type { ResolveOrderState, TradeFormState } from "./trade-state";

/**
 * Places an order. All guards (min order, balances, target price) run in the use
 * case — the authoritative check; the trade screen only mirrors them for instant
 * feedback. A MARKET order settles synchronously today (→ `success`); a LIMIT
 * order is ACCEPTED and rests (→ `accepted`), which the screen resolves by
 * polling {@link resolveOrder}.
 */
export async function placeTradeOrder(
  _prev: TradeFormState,
  formData: FormData,
): Promise<TradeFormState> {
  const coinId = String(formData.get("coinId") ?? "");
  const side = formData.get("side") === "sell" ? "sell" : "buy";
  const amountIrt = Number(formData.get("amountIrt") ?? 0);
  const orderType: OrderType =
    formData.get("orderType") === "LIMIT" ? "LIMIT" : "MARKET";
  const rawTarget = formData.get("targetPriceIrt");
  const targetPriceIrt =
    rawTarget != null && rawTarget !== "" ? Number(rawTarget) : null;

  const result = await container
    .resolve(TOKENS.PlaceOrderUseCase)
    .execute(coinId, side, amountIrt, { orderType, targetPriceIrt });

  if (!result.ok) {
    return {
      status: "error",
      message: result.error.message,
      code: result.error.code,
    };
  }

  if (result.data.kind === "accepted") {
    return {
      status: "accepted",
      orderId: result.data.orderId,
      phase: result.data.phase,
      orderType,
    };
  }
  return { status: "success", order: result.data.order };
}

/**
 * Resolves a 202-accepted order by polling `GET /orders/{orderId}` to a terminal
 * status (or a timeout hand-off). A LIMIT order rests until its price trigger, so
 * it gets a short budget then hands off to the open-orders list; a market-async
 * order gets the full budget to finalize. The poll is resilient — a transient
 * read failure just retries, and the order is never lost (it's in the open list).
 */
export async function resolveOrder(
  orderId: string,
  orderType: OrderType,
): Promise<ResolveOrderState> {
  if (!orderId) return { status: "error", message: "شناسه سفارش نامعتبر است." };

  // A limit order typically rests until triggered — don't tie up the request for
  // long; poll a few times for an instant trigger, then hand off to open orders.
  const options =
    orderType === "LIMIT"
      ? { intervalMs: 1200, maxAttempts: 3 }
      : { intervalMs: 900, maxAttempts: 12 };

  const result = await container
    .resolve(TOKENS.PollOrderUseCase)
    .execute(orderId, options);

  if (!result.ok) return { status: "error", message: result.error.message };
  return { status: result.data.status, reason: result.data.order?.reason };
}
