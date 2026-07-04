import type { Coin } from "@/lib/core/domain/market/coin";
import type { DepositAddress } from "@/lib/core/domain/wallet/deposit";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { WalletRepository } from "../ports/wallet-repository.port";

/** The crypto-deposit view's data: the coin + its deposit address; null if unknown. */
export class GetDepositAddressUseCase {
  constructor(
    private readonly market: MarketRepository,
    private readonly wallet: WalletRepository,
  ) {}

  async execute(
    coinId: string,
  ): Promise<Result<{ coin: Coin; deposit: DepositAddress } | null>> {
    const coins = await this.market.listCoins();
    if (!coins.ok) return coins;
    const coin = coins.data.find((c) => c.id === coinId.toLowerCase());
    if (!coin) return ok(null);

    const deposit = await this.wallet.getDepositAddress(coin.id);
    if (!deposit.ok) return deposit;
    return ok({ coin, deposit: deposit.data });
  }
}
