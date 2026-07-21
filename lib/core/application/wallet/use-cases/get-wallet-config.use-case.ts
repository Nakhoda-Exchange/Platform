import type { WalletConfig } from "@/lib/core/domain/wallet/wallet-config";
import type { Result } from "@/lib/core/domain/shared/result";
import type { WalletConfigRepository } from "../ports/wallet-config-repository.port";

/** Loads the wallet's deposit/withdraw config (minimums, fee, OTP requirement). */
export class GetWalletConfigUseCase {
  constructor(private readonly config: WalletConfigRepository) {}

  execute(): Promise<Result<WalletConfig>> {
    return this.config.getWalletConfig();
  }
}
