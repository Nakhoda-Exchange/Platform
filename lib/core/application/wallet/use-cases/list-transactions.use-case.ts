import type {
  Transaction,
  TransactionType,
} from "@/lib/core/domain/wallet/transaction";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { TransactionsRepository } from "../ports/transactions-repository.port";

/** Wallet history, newest first, optionally narrowed to one type. */
export class ListTransactionsUseCase {
  constructor(private readonly transactions: TransactionsRepository) {}

  async execute(type?: TransactionType): Promise<Result<Transaction[]>> {
    const result = await this.transactions.listTransactions();
    if (!result.ok) return result;
    const list = result.data
      .filter((t) => !type || t.type === type)
      .sort((a, b) => b.at.getTime() - a.at.getTime());
    return ok(list);
  }
}
