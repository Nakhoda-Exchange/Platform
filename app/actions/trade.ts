"use server";

import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import type { TradeFormState } from "./trade-state";

/**
 * Places a mock market order. All guards (min order, balances) run in the use
 * case — the authoritative check; the trade screen only mirrors them for
 * instant feedback.
 */
export async function placeTradeOrder(
  _prev: TradeFormState,
  formData: FormData,
): Promise<TradeFormState> {
  const coinId = String(formData.get("coinId") ?? "");
  const side = formData.get("side") === "sell" ? "sell" : "buy";
  const amountIrt = Number(formData.get("amountIrt") ?? 0);

  const result = await container
    .resolve(TOKENS.PlaceOrderUseCase)
    .execute(coinId, side, amountIrt);

  if (!result.ok) {
    return { status: "error", message: result.error.message };
  }
  return { status: "success", order: result.data };
}
