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
 * States the polling endpoint reports. Mirrors the SHIPPED backend enum
 * (`DepositStatusSchema` in Substructure's wallet-ops.schemas.ts): the wire only
 * ever carries these three.
 *
 * Richer states (`expired` / `amount_mismatch` / `failed`) are documented in
 * doc/deposit/api.md as a backend follow-up (#74) and are deliberately NOT
 * modelled here yet — narrowing to what the server actually sends keeps the
 * client from branching on statuses it can never receive.
 */
export type DepositStatus = "pending" | "done" | "unknown";

/**
 * A polled deposit, as `GET /wallet/deposits/{id}/status` reports it.
 *
 * `creditedIrt` is what the ledger ACTUALLY credited — the only figure a receipt
 * may truthfully state. The amount the user typed on the deposit screen is an
 * INTENT: people transfer a slightly different amount than they typed, and
 * showing the typed figure as if it had been credited is a money dispute
 * waiting to happen (audit #64).
 *
 * Null until the deposit is `done`, because nothing has been credited before
 * then. Older backends omit it, which reads the same way.
 *
 * `requestedIrt` is what the user asked to send, so a mismatch can be stated
 * plainly rather than one figure quietly substituting for the other.
 *
 * Both cross the wire as decimal STRINGS and are parsed to numbers in the HTTP
 * adapter — never consumed raw.
 */
export interface DepositStatusView {
  status: DepositStatus;
  creditedIrt: number | null;
  requestedIrt: number | null;
}
