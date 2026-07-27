/**
 * What happened: money in/out (Toman), a trade, a reward credit, or a
 * `clawback` — an unvested gift recovered because the user abandoned it or its
 * terms went unmet by the deadline.
 *
 * `clawback` is deliberately its own type rather than a negative `reward`: it is
 * the only row here that takes money the user was previously shown as theirs,
 * and it deserves to say so plainly instead of hiding inside another label.
 */
export type TransactionType =
  "deposit" | "withdraw" | "buy" | "sell" | "reward" | "clawback";

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

/**
 * The FILTERABLE types — the chips on the history screen, not the full union.
 * `clawback` is deliberately absent: at most one or two rows will ever exist per
 * user, and a permanent chip for it would cost every user screen width to serve
 * an almost-empty filter.
 */
export const TRANSACTION_TYPES: readonly TransactionType[] = [
  "buy",
  "sell",
  "deposit",
  "withdraw",
  "reward",
];
