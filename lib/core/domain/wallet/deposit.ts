/** Smallest Toman deposit the platform accepts. */
export const MIN_DEPOSIT_IRT = 100_000;

/** Where to send a coin to credit the account. */
export interface DepositAddress {
  address: string;
  network: string; // Persian network label, e.g. «اتریوم (ERC-20)»
}

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
