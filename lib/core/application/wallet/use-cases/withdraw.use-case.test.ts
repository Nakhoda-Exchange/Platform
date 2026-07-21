import { describe, expect, test } from "bun:test";
import { WithdrawUseCase } from "./withdraw.use-case";
import type {
  TradeBalances,
  TradeRepository,
} from "@/lib/core/application/trade/ports/trade-repository.port";
import type { WalletRepository } from "../ports/wallet-repository.port";
import type { WalletConfigRepository } from "../ports/wallet-config-repository.port";
import type { WalletConfig } from "@/lib/core/domain/wallet/wallet-config";
import { ok, type Result } from "@/lib/core/domain/shared/result";

const CONFIG: WalletConfig = {
  deposit: { minIrt: 100_000 },
  withdraw: {
    minIrt: 500_000,
    feeBps: 100,
    feeCapIrt: 50_000,
    otpRequired: false,
  },
};

function tradeStub(balances: TradeBalances): TradeRepository {
  return {
    getBalances: async () => ok(balances),
    getLimits: async () => ok({ defaultMinIrt: null, bySymbol: {} }),
    placeOrder: async () => {
      throw new Error("not used");
    },
  };
}

function walletStub() {
  const calls: Array<{ ibanId: string; amountIrt: number; otp?: string }> = [];
  const repo = {
    requestIrtWithdraw: async (
      ibanId: string,
      amountIrt: number,
      otp?: string,
    ): Promise<Result<{ id: string }>> => {
      calls.push({ ibanId, amountIrt, otp });
      return ok({ id: "w_1" });
    },
  } as unknown as WalletRepository;
  return { repo, calls };
}

function configStub(config: WalletConfig = CONFIG): WalletConfigRepository {
  return { getWalletConfig: async () => ok(config) };
}

const balances: TradeBalances = { availableIrt: 5_000_000, coinAmounts: {} };

describe("WithdrawUseCase.irt", () => {
  test("rejects below the config minimum with a formatted message", async () => {
    const wallet = walletStub();
    const uc = new WithdrawUseCase(
      tradeStub(balances),
      wallet.repo,
      configStub(),
    );
    const res = await uc.irt("iban_1", 100_000);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("BELOW_MIN_WITHDRAW");
    expect(wallet.calls.length).toBe(0);
  });

  test("uses the backend config minimum (not the hardcoded constant)", async () => {
    // A backend that allows a lower minimum than the 500k default constant.
    const lower = {
      ...CONFIG,
      withdraw: { ...CONFIG.withdraw, minIrt: 200_000 },
    };
    const wallet = walletStub();
    const uc = new WithdrawUseCase(
      tradeStub(balances),
      wallet.repo,
      configStub(lower),
    );
    const res = await uc.irt("iban_1", 300_000);
    expect(res.ok).toBe(true);
    expect(wallet.calls[0]?.amountIrt).toBe(300_000);
  });

  test("threads the OTP code through to the repository", async () => {
    const wallet = walletStub();
    const uc = new WithdrawUseCase(
      tradeStub(balances),
      wallet.repo,
      configStub(),
    );
    const res = await uc.irt("iban_1", 1_000_000, "123456");
    expect(res.ok).toBe(true);
    expect(wallet.calls[0]?.otp).toBe("123456");
  });

  test("falls back to the constant minimum when config is unavailable", async () => {
    const wallet = walletStub();
    const failingConfig: WalletConfigRepository = {
      getWalletConfig: async () => ({
        ok: false,
        error: { code: "X", message: "down" },
      }),
    };
    const uc = new WithdrawUseCase(
      tradeStub(balances),
      wallet.repo,
      failingConfig,
    );
    // 400k is below the 500k constant fallback → rejected.
    const res = await uc.irt("iban_1", 400_000);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("BELOW_MIN_WITHDRAW");
  });

  test("rejects when the amount exceeds the available balance", async () => {
    const wallet = walletStub();
    const uc = new WithdrawUseCase(
      tradeStub({ availableIrt: 600_000, coinAmounts: {} }),
      wallet.repo,
      configStub(),
    );
    const res = await uc.irt("iban_1", 1_000_000);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INSUFFICIENT_IRT");
    expect(wallet.calls.length).toBe(0);
  });
});
