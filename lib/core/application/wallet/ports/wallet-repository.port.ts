import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import type {
  CardDeposit,
  DepositAddress,
  DepositStatus,
} from "@/lib/core/domain/wallet/deposit";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for moving money in and out. Adapters live in infrastructure. */
export interface WalletRepository {
  /** The user's deposit address for a coin. */
  getDepositAddress(coinId: string): Promise<Result<DepositAddress>>;
  /** The user's saved bank cards. */
  listCards(): Promise<Result<BankCard[]>>;
  /** Save a (validated) card number; returns the stored card. */
  addCard(number: string): Promise<Result<BankCard>>;
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
  /** Crypto withdrawal network fee per coin id, in units of that coin. */
  getWithdrawFees(): Promise<Result<Record<string, number>>>;
  /** Request a Toman withdrawal to one of the user's cards (stays pending). */
  requestIrtWithdraw(
    cardId: string,
    amountIrt: number,
  ): Promise<Result<{ id: string }>>;
  /** Request a crypto withdrawal to an external address (stays pending). */
  requestCryptoWithdraw(
    coinId: string,
    address: string,
    amountCoin: number,
    amountIrt: number,
  ): Promise<Result<{ id: string }>>;
}
