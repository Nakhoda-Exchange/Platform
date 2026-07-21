/** What happened: money in/out (Toman), a trade, or a referral reward. */
export type TransactionType =
  "deposit" | "withdraw" | "buy" | "sell" | "reward";

export type TransactionStatus = "pending" | "done" | "failed";

/** One entry in the wallet history timeline. */
export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  at: Date;
  amountIrt: string; // Toman value of the transaction, always positive (decimal string)
  // Trade-only fields — absent for Toman deposits/withdrawals.
  symbol?: string; // e.g. BTC
  coinName?: string; // Persian name, e.g. «بیت‌کوین»
  amountCoin?: string; // coin units traded (decimal string)
  iconUrl?: string; // coin logo
}

export const TRANSACTION_TYPES: readonly TransactionType[] = [
  "buy",
  "sell",
  "deposit",
  "withdraw",
  "reward",
];
