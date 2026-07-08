import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import type { Iban } from "@/lib/core/domain/wallet/bank-account";
import type {
  CardDeposit,
  DepositStatus,
} from "@/lib/core/domain/wallet/deposit";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for moving money in and out. Adapters live in infrastructure. */
export interface WalletRepository {
  /** The user's saved bank cards. */
  listCards(): Promise<Result<BankCard[]>>;
  /** Save a (validated, ownership-verified) card; returns the stored card. */
  addCard(number: string, ownerName: string): Promise<Result<BankCard>>;
  /** Make a saved card the primary one (auto-selected for deposit/withdraw). */
  setPrimaryCard(id: string): Promise<Result<void>>;
  /** Forget a saved card. */
  removeCard(id: string): Promise<Result<void>>;
  /** The user's saved IBANs (شبا). */
  listIbans(): Promise<Result<Iban[]>>;
  /** Save a (validated, ownership-verified) IBAN; returns the stored IBAN. */
  addIban(value: string, ownerName: string): Promise<Result<Iban>>;
  /** Make a saved IBAN the primary one. */
  setPrimaryIban(id: string): Promise<Result<void>>;
  /** Forget a saved IBAN. */
  removeIban(id: string): Promise<Result<void>>;
  /**
   * Start a card-to-card deposit from one of the user's cards. The response
   * carries the company's destination card for this deposit.
   */
  initiateCardDeposit(
    cardId: string,
    amountIrt: number,
  ): Promise<Result<CardDeposit>>;
  /** Poll a started deposit until the backend reports it submitted. */
  getDepositStatus(depositId: string): Promise<Result<DepositStatus>>;
  /** Request a Toman withdrawal to one of the user's IBANs (stays pending). */
  requestIrtWithdraw(
    ibanId: string,
    amountIrt: number,
  ): Promise<Result<{ id: string }>>;
}
