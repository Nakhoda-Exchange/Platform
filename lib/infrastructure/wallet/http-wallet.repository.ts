import type { WalletRepository } from "@/lib/core/application/wallet/ports/wallet-repository.port";
import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import type { Iban } from "@/lib/core/domain/wallet/bank-account";
import type {
  CardDeposit,
  DepositStatus,
} from "@/lib/core/domain/wallet/deposit";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter for deposits/withdrawals. Contracts: doc/deposit/api.md + doc/withdraw/api.md. */
export class HttpWalletRepository implements WalletRepository {
  constructor(private readonly http: HttpClient) {}

  listCards(): Promise<Result<BankCard[]>> {
    return this.http.get<BankCard[]>("/wallet/cards");
  }

  addCard(number: string, ownerName: string): Promise<Result<BankCard>> {
    return this.http.post<BankCard>("/wallet/cards", { number, ownerName });
  }

  setPrimaryCard(id: string): Promise<Result<void>> {
    return this.http.request<void>({
      method: "PUT",
      path: `/wallet/cards/${encodeURIComponent(id)}/primary`,
    });
  }

  removeCard(id: string): Promise<Result<void>> {
    return this.http.request<void>({
      method: "DELETE",
      path: `/wallet/cards/${encodeURIComponent(id)}`,
    });
  }

  listIbans(): Promise<Result<Iban[]>> {
    return this.http.get<Iban[]>("/wallet/ibans");
  }

  addIban(value: string, ownerName: string): Promise<Result<Iban>> {
    return this.http.post<Iban>("/wallet/ibans", { iban: value, ownerName });
  }

  setPrimaryIban(id: string): Promise<Result<void>> {
    return this.http.request<void>({
      method: "PUT",
      path: `/wallet/ibans/${encodeURIComponent(id)}/primary`,
    });
  }

  removeIban(id: string): Promise<Result<void>> {
    return this.http.request<void>({
      method: "DELETE",
      path: `/wallet/ibans/${encodeURIComponent(id)}`,
    });
  }

  initiateCardDeposit(
    cardId: string,
    amountIrt: number,
  ): Promise<Result<CardDeposit>> {
    return this.http.post<CardDeposit>("/wallet/deposits/card", {
      cardId,
      amountIrt,
    });
  }

  async getDepositStatus(depositId: string): Promise<Result<DepositStatus>> {
    const result = await this.http.get<{ status: DepositStatus }>(
      `/wallet/deposits/${encodeURIComponent(depositId)}/status`,
    );
    if (!result.ok) return result;
    return { ok: true, data: result.data.status };
  }

  requestIrtWithdraw(
    ibanId: string,
    amountIrt: number,
    otp?: string,
  ): Promise<Result<{ id: string }>> {
    // Only include `otp` when supplied so the request body is unchanged when the
    // backend doesn't require the second factor.
    return this.http.post<{ id: string }>("/wallet/withdrawals/irt", {
      ibanId,
      amountIrt,
      ...(otp ? { otp } : {}),
    });
  }
}
