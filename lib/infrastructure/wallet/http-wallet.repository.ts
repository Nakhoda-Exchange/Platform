import type { WalletRepository } from "@/lib/core/application/wallet/ports/wallet-repository.port";
import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import type {
  CardDeposit,
  DepositAddress,
  DepositStatus,
} from "@/lib/core/domain/wallet/deposit";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter for deposits/withdrawals. Contracts: doc/deposit/api.md + doc/withdraw/api.md. */
export class HttpWalletRepository implements WalletRepository {
  constructor(private readonly http: HttpClient) {}

  getDepositAddress(coinId: string): Promise<Result<DepositAddress>> {
    return this.http.get<DepositAddress>(
      `/wallet/deposit-address/${encodeURIComponent(coinId)}`,
    );
  }

  listCards(): Promise<Result<BankCard[]>> {
    return this.http.get<BankCard[]>("/wallet/cards");
  }

  addCard(number: string): Promise<Result<BankCard>> {
    return this.http.post<BankCard>("/wallet/cards", { number });
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

  getWithdrawFees(): Promise<Result<Record<string, number>>> {
    return this.http.get<Record<string, number>>("/wallet/withdraw-fees");
  }

  requestIrtWithdraw(
    cardId: string,
    amountIrt: number,
  ): Promise<Result<{ id: string }>> {
    return this.http.post<{ id: string }>("/wallet/withdrawals/irt", {
      cardId,
      amountIrt,
    });
  }

  requestCryptoWithdraw(
    coinId: string,
    address: string,
    amountCoin: number,
    amountIrt: number,
  ): Promise<Result<{ id: string }>> {
    return this.http.post<{ id: string }>("/wallet/withdrawals/crypto", {
      coinId,
      address,
      amountCoin,
      amountIrt,
    });
  }
}
