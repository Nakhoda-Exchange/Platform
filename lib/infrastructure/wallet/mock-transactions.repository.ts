import type { TransactionsRepository } from "@/lib/core/application/wallet/ports/transactions-repository.port";
import type { Transaction } from "@/lib/core/domain/wallet/transaction";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import { wallet } from "../portfolio/mock-wallet-state";

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reads the shared in-memory mock wallet's history — seeded entries plus any
 * trades settled this process (see settleTrade).
 */
export class MockTransactionsRepository implements TransactionsRepository {
  async listTransactions(): Promise<Result<Transaction[]>> {
    await delay();
    return ok([...wallet.transactions]);
  }
}
