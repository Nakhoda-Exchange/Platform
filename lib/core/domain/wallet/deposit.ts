/** Smallest Toman deposit the platform accepts. */
export const MIN_DEPOSIT_IRT = 100_000;

/**
 * A started card-to-card deposit. The company card is FETCHED per deposit
 * (returned by the backend after the user picks their source card) — never
 * hardcoded client-side.
 */
export interface CardDeposit {
  id: string;
  companyCard: string; // 16-digit destination card to transfer to
  companyName: string; // card holder, e.g. «شرکت ناخدا»
  expiresInSeconds: number; // how long the user has to complete the transfer
}

/**
 * Terminal + in-flight states of a card-to-card deposit. `done` means the bank
 * transfer settled; `amount_mismatch` means a different sum arrived than was
 * requested; `expired` means the deposit window closed with no matching
 * transfer; `failed` is a house/back-office fault. (Replaces the old `unknown`.)
 * See doc/deposit/api.md.
 */
export type DepositStatus =
  "pending" | "done" | "expired" | "amount_mismatch" | "failed";

/**
 * Full status report from `GET /wallet/deposits/{id}/status`. The credited
 * amount is the SERVER/bank-confirmed settled sum — never the client-typed
 * amount (#64). The receipt and history must render `creditedIrt`, not the
 * amount the user entered.
 */
export interface DepositStatusReport {
  status: DepositStatus;
  /** Bank-confirmed credited amount in Toman; present when `status === "done"`. */
  creditedIrt?: number;
  /** Bank-observed amount in Toman; present when `status === "amount_mismatch"`. */
  observedIrt?: number;
  /** House-fault reason; present when `status === "failed"`. */
  reason?: string;
}
