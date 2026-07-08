import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import type { Iban } from "@/lib/core/domain/wallet/bank-account";

/** Action results for bank-account management (types live beside the "use server" file). */
export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; message: string };

export type AddCardResult = ActionResult<BankCard>;
export type AddIbanResult = ActionResult<Iban>;
export type MutateResult = ActionResult<null>;
