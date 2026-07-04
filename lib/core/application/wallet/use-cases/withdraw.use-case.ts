import {
  isPlausibleCryptoAddress,
  MIN_WITHDRAW_IRT,
} from "@/lib/core/domain/wallet/withdraw";
import { fail, type Result } from "@/lib/core/domain/shared/result";
import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { TradeRepository } from "@/lib/core/application/trade/ports/trade-repository.port";
import type { WalletRepository } from "../ports/wallet-repository.port";

/**
 * Withdrawals — Toman to one of the user's cards, or a coin to an external
 * address. All guards live here (authoritative); both paths produce a PENDING
 * transaction (a back-office approves real withdrawals).
 */
export class WithdrawUseCase {
  constructor(
    private readonly market: MarketRepository,
    private readonly trade: TradeRepository,
    private readonly wallet: WalletRepository,
  ) {}

  fees(): Promise<Result<Record<string, number>>> {
    return this.wallet.getWithdrawFees();
  }

  /** The withdrawable balances (pass-through for the withdraw screens). */
  balances() {
    return this.trade.getBalances();
  }

  async irt(
    cardId: string,
    amountIrt: number,
  ): Promise<Result<{ id: string }>> {
    if (!cardId) return fail("NO_CARD", "کارت مقصد را انتخاب کنید.");
    if (!Number.isFinite(amountIrt) || amountIrt <= 0) {
      return fail("EMPTY_AMOUNT", "مبلغ برداشت را وارد کنید.");
    }
    if (amountIrt < MIN_WITHDRAW_IRT) {
      return fail("BELOW_MIN_WITHDRAW", "کمینه برداشت ۵۰۰٬۰۰۰ تومان است.");
    }
    const balances = await this.trade.getBalances();
    if (!balances.ok) return balances;
    if (amountIrt > balances.data.availableIrt) {
      return fail("INSUFFICIENT_IRT", "موجودی تومانی شما کافی نیست.");
    }
    return this.wallet.requestIrtWithdraw(cardId, amountIrt);
  }

  async crypto(
    coinId: string,
    address: string,
    amountCoin: number,
  ): Promise<Result<{ id: string }>> {
    if (!isPlausibleCryptoAddress(address)) {
      return fail("INVALID_ADDRESS", "آدرس مقصد درست نیست. آن را بررسی کنید.");
    }
    if (!Number.isFinite(amountCoin) || amountCoin <= 0) {
      return fail("EMPTY_AMOUNT", "مقدار برداشت را وارد کنید.");
    }

    const coins = await this.market.listCoins();
    if (!coins.ok) return coins;
    const coin = coins.data.find((c) => c.id === coinId.toLowerCase());
    if (!coin) return fail("UNKNOWN_COIN", "این رمزارز قابل برداشت نیست.");

    const fees = await this.wallet.getWithdrawFees();
    if (!fees.ok) return fees;
    const fee = fees.data[coin.id] ?? 0;
    if (amountCoin <= fee) {
      return fail("BELOW_FEE", "مقدار برداشت باید از کارمزد شبکه بیشتر باشد.");
    }

    const balances = await this.trade.getBalances();
    if (!balances.ok) return balances;
    const held = balances.data.coinAmounts[coin.id] ?? 0;
    if (amountCoin > held) {
      return fail("INSUFFICIENT_COIN", "موجودی این رمزارز کافی نیست.");
    }

    const amountIrt = Math.round(amountCoin * coin.priceIrt);
    return this.wallet.requestCryptoWithdraw(
      coin.id,
      address.trim(),
      amountCoin,
      amountIrt,
    );
  }
}
