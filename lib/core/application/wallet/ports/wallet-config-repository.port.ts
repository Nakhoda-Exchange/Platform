import type { WalletConfig } from "@/lib/core/domain/wallet/wallet-config";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for reading the wallet's deposit/withdraw config. Adapter in infrastructure. */
export interface WalletConfigRepository {
  /** Deposit/withdraw minimums, the withdrawal fee, and the OTP requirement. */
  getWalletConfig(): Promise<Result<WalletConfig>>;
}
