"use server";

import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import type {
  AddCardResult,
  AddIbanResult,
  MutateResult,
} from "./bank-account-state";

/** Add a bank card — validated (16 digits + Luhn) and ownership-checked in the use case. */
export async function addCard(number: string): Promise<AddCardResult> {
  const result = await container.resolve(TOKENS.ManageCardsUseCase).add(number);
  if (!result.ok) return { ok: false, message: result.error.message };
  return { ok: true, data: result.data };
}

/** Make a saved card the primary one (auto-selected for deposit/withdraw). */
export async function setPrimaryCard(id: string): Promise<MutateResult> {
  const result = await container
    .resolve(TOKENS.ManageCardsUseCase)
    .setPrimary(id);
  if (!result.ok) return { ok: false, message: result.error.message };
  return { ok: true, data: null };
}

/** Remove a saved card. */
export async function removeCard(id: string): Promise<MutateResult> {
  const result = await container.resolve(TOKENS.ManageCardsUseCase).remove(id);
  if (!result.ok) return { ok: false, message: result.error.message };
  return { ok: true, data: null };
}

/** Add an IBAN (شبا) — validated (IR + 24 digits, mod-97) and ownership-checked. */
export async function addIban(value: string): Promise<AddIbanResult> {
  const result = await container.resolve(TOKENS.ManageIbansUseCase).add(value);
  if (!result.ok) return { ok: false, message: result.error.message };
  return { ok: true, data: result.data };
}

/** Make a saved IBAN the primary one. */
export async function setPrimaryIban(id: string): Promise<MutateResult> {
  const result = await container
    .resolve(TOKENS.ManageIbansUseCase)
    .setPrimary(id);
  if (!result.ok) return { ok: false, message: result.error.message };
  return { ok: true, data: null };
}

/** Remove a saved IBAN. */
export async function removeIban(id: string): Promise<MutateResult> {
  const result = await container.resolve(TOKENS.ManageIbansUseCase).remove(id);
  if (!result.ok) return { ok: false, message: result.error.message };
  return { ok: true, data: null };
}
