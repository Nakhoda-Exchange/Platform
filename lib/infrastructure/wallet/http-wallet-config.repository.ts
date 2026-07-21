import type { WalletConfigRepository } from "@/lib/core/application/wallet/ports/wallet-config-repository.port";
import {
  FALLBACK_WALLET_CONFIG,
  type WalletConfig,
} from "@/lib/core/domain/wallet/wallet-config";
import { parsePrice } from "@/lib/core/domain/market/price";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/**
 * Wire shape of `GET /v1/wallet/config`. Money fields (`minIrt`, `feeCapIrt`)
 * are exact decimal STRINGS (backend issue #85); `feeBps` is a number and
 * `otpRequired` a boolean. Extra fields (e.g. the company card) are ignored —
 * the deposit company card is fetched per-deposit, never from here.
 */
interface WalletConfigDto {
  deposit?: { minIrt?: string | null };
  withdraw?: {
    minIrt?: string | null;
    feeBps?: number | null;
    feeCapIrt?: string | null;
    otpRequired?: boolean | null;
  };
}

/** HTTP adapter for wallet config. Contract: doc/wallet/api.md (#156). */
export class HttpWalletConfigRepository implements WalletConfigRepository {
  constructor(private readonly http: HttpClient) {}

  async getWalletConfig(): Promise<Result<WalletConfig>> {
    const res = await this.http.get<WalletConfigDto>("/wallet/config");
    if (!res.ok) return res;

    const dto = res.data;
    const config: WalletConfig = {
      deposit: {
        minIrt:
          parsePrice(dto.deposit?.minIrt) ??
          FALLBACK_WALLET_CONFIG.deposit.minIrt,
      },
      withdraw: {
        minIrt:
          parsePrice(dto.withdraw?.minIrt) ??
          FALLBACK_WALLET_CONFIG.withdraw.minIrt,
        feeBps: dto.withdraw?.feeBps ?? FALLBACK_WALLET_CONFIG.withdraw.feeBps,
        feeCapIrt:
          parsePrice(dto.withdraw?.feeCapIrt) ??
          FALLBACK_WALLET_CONFIG.withdraw.feeCapIrt,
        otpRequired:
          dto.withdraw?.otpRequired ??
          FALLBACK_WALLET_CONFIG.withdraw.otpRequired,
      },
    };
    return { ok: true, data: config };
  }
}
