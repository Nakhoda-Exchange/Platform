import type { TransactionsRepository } from "@/lib/core/application/wallet/ports/transactions-repository.port";
import type { Transaction } from "@/lib/core/domain/wallet/transaction";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** Wire shape: `at` travels as ISO 8601. Contract: doc/history/api.md. */
type TransactionDto = Omit<Transaction, "at"> & { at: string };

/** HTTP adapter for the wallet history. */
export class HttpTransactionsRepository implements TransactionsRepository {
  constructor(private readonly http: HttpClient) {}

  async listTransactions(): Promise<Result<Transaction[]>> {
    const result = await this.http.get<TransactionDto[]>(
      "/wallet/transactions",
    );
    if (!result.ok) return result;
    return ok(result.data.map((t) => ({ ...t, at: new Date(t.at) })));
  }
}
