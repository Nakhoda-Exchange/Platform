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

export type DepositStatus = "pending" | "done" | "unknown";

/**
 * A polled deposit.
 *
 * `creditedIrt` is what the ledger ACTUALLY credited — the only figure a receipt
 * may truthfully state. The amount the user typed on the deposit screen is an
 * INTENT: people transfer a slightly different amount than they typed, and
 * showing the typed figure as if it had been credited is a money dispute
 * waiting to happen (audit #64).
 *
 * Null until the deposit is `done`, because nothing has been credited before
 * then. Older backends omit it, which reads the same way.
 */
export interface DepositStatusView {
  status: DepositStatus;
  creditedIrt: number | null;
  requestedIrt: number | null;
}
