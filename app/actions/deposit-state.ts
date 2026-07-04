import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import type {
  CardDeposit,
  DepositStatus,
} from "@/lib/core/domain/wallet/deposit";

/** Action results for the deposit flow (types live beside the "use server" file). */
export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; message: string };

export type AddCardResult = ActionResult<BankCard>;
export type StartDepositResult = ActionResult<CardDeposit>;
export type DepositStatusResult = ActionResult<DepositStatus>;
