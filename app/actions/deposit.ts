"use server";

import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { toEnglishDigits } from "@/lib/utils/digits";
import type {
  AddCardResult,
  DepositStatusResult,
  StartDepositResult,
} from "./deposit-state";

/** Save a user bank card (validated in the use case: 16 digits + Luhn). */
export async function addBankCard(number: string): Promise<AddCardResult> {
  const result = await container.resolve(TOKENS.ManageCardsUseCase).add(number);
  if (!result.ok) return { ok: false, message: result.error.message };
  return { ok: true, data: result.data };
}

/**
 * Start a card-to-card deposit from the selected card. The response carries
 * the company's destination card, fetched per deposit.
 */
export async function startCardDeposit(
  cardId: string,
  amount: string,
): Promise<StartDepositResult> {
  const amountIrt = Number(toEnglishDigits(amount).replace(/[^\d]/g, ""));
  const result = await container
    .resolve(TOKENS.DepositIrtUseCase)
    .start(cardId, amountIrt);
  if (!result.ok) return { ok: false, message: result.error.message };
  return { ok: true, data: result.data };
}

/** Poll a started deposit until the backend reports it submitted. */
export async function checkDeposit(
  depositId: string,
): Promise<DepositStatusResult> {
  const result = await container
    .resolve(TOKENS.DepositIrtUseCase)
    .status(depositId);
  if (!result.ok) return { ok: false, message: result.error.message };
  return { ok: true, data: result.data };
}
