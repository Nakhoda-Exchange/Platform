"use server";

import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { toEnglishDigits } from "@/lib/utils/digits";
import type { ActionResult } from "./deposit-state";

/** Request a Toman withdrawal to one of the user's cards (stays pending). */
export async function requestIrtWithdraw(
  cardId: string,
  amount: string,
): Promise<ActionResult<{ id: string }>> {
  const amountIrt = Number(toEnglishDigits(amount).replace(/[^\d]/g, ""));
  const result = await container
    .resolve(TOKENS.WithdrawUseCase)
    .irt(cardId, amountIrt);
  if (!result.ok) return { ok: false, message: result.error.message };
  return { ok: true, data: result.data };
}

/** Request a crypto withdrawal to an external address (stays pending). */
export async function requestCryptoWithdraw(
  coinId: string,
  address: string,
  amount: string,
): Promise<ActionResult<{ id: string }>> {
  const amountCoin = Number(
    toEnglishDigits(amount)
      .replace("٫", ".")
      .replace(/[^\d.]/g, ""),
  );
  const result = await container
    .resolve(TOKENS.WithdrawUseCase)
    .crypto(coinId, address, amountCoin);
  if (!result.ok) return { ok: false, message: result.error.message };
  return { ok: true, data: result.data };
}
