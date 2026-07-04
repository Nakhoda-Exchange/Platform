/** What happened: money in/out (Toman) or a trade (coin bought/sold). */
export type TransactionType = "deposit" | "withdraw" | "buy" | "sell";

export type TransactionStatus = "pending" | "done" | "failed";

/** One entry in the wallet history timeline. */
export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  at: Date;
  amountIrt: number; // Toman value of the transaction (always positive)
  // Trade-only fields — absent for Toman deposits/withdrawals.
  symbol?: string; // e.g. BTC
  coinName?: string; // Persian name, e.g. «بیت‌کوین»
  amountCoin?: number; // coin units traded
  iconUrl?: string; // coin logo
}

export const TRANSACTION_TYPES: readonly TransactionType[] = [
  "buy",
  "sell",
  "deposit",
  "withdraw",
];
