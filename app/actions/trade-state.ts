import type { PlacedOrder } from "@/lib/core/domain/trade/order";

/**
 * Trade form state ("use server" files may only export async functions, so
 * these types live here beside app/actions/trade.ts).
 */
export type TradeFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; order: PlacedOrder };
