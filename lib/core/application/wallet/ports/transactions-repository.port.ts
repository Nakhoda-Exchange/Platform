import type { Transaction } from "@/lib/core/domain/wallet/transaction";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for the wallet history. Concrete adapters live in infrastructure. */
export interface TransactionsRepository {
  /** All of the user's transactions, any order (the use case sorts). */
  listTransactions(): Promise<Result<Transaction[]>>;
}
