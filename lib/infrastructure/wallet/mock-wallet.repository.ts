import type { WalletRepository } from "@/lib/core/application/wallet/ports/wallet-repository.port";
import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import type {
  CardDeposit,
  DepositAddress,
  DepositStatus,
} from "@/lib/core/domain/wallet/deposit";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import { wallet } from "../portfolio/mock-wallet-state";

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Deterministic fake deposit addresses/networks per coin family. Swap for an
// HTTP adapter in the composition root when the backend lands.
const ADDRESSES: Record<string, DepositAddress> = {
  btc: {
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    network: "بیت‌کوین (BTC)",
  },
  usdt: {
    address: "TQrY8bkbpXhPxdrLgKqYbErTVGL7NxxNqR",
    network: "ترون (TRC-20)",
  },
  ton: {
    address: "EQCcLAW537KnRg_aSPrnQJoyYjOZkzqYp6FVmRUvN1crSazV",
    network: "تون (TON)",
  },
};
const EVM: DepositAddress = {
  address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  network: "اتریوم (ERC-20)",
};

// The user's saved cards (per-process; starts empty so the add-card sheet is
// the first-run path).
const CARDS: BankCard[] = [];

// How long the mock "backend" takes to observe the card-to-card transfer and
// emit the deposit-submitted event.
const MOCK_SETTLE_MS = 15_000;

export class MockWalletRepository implements WalletRepository {
  async getDepositAddress(coinId: string): Promise<Result<DepositAddress>> {
    await delay(200);
    return ok(ADDRESSES[coinId] ?? EVM);
  }

  async listCards(): Promise<Result<BankCard[]>> {
    await delay(150);
    return ok([...CARDS]);
  }

  async addCard(number: string): Promise<Result<BankCard>> {
    await delay(250);
    const existing = CARDS.find((c) => c.number === number);
    if (existing) return ok(existing);
    const card: BankCard = { id: crypto.randomUUID(), number };
    CARDS.push(card);
    return ok(card);
  }

  async initiateCardDeposit(
    cardId: string,
    amountIrt: number,
  ): Promise<Result<CardDeposit>> {
    await delay();
    const id = crypto.randomUUID();
    // Pending until the mock backend "sees" the transfer.
    wallet.transactions.push({
      id,
      type: "deposit",
      status: "pending",
      at: new Date(),
      amountIrt,
    });
    // The backend event: after a short wait the deposit is submitted — flip
    // the transaction to done and credit the balance. Per-process, like all
    // mock state; a real adapter replaces this with a server event/webhook.
    setTimeout(() => {
      const tx = wallet.transactions.find((t) => t.id === id);
      if (tx && tx.status === "pending") {
        tx.status = "done";
        wallet.irt += amountIrt;
      }
    }, MOCK_SETTLE_MS);

    return ok({
      id,
      companyCard: "6219861900045875",
      companyName: "شرکت ناخدا",
      expiresInSeconds: 600,
    });
  }

  async getDepositStatus(depositId: string): Promise<Result<DepositStatus>> {
    await delay(100);
    const tx = wallet.transactions.find((t) => t.id === depositId);
    if (!tx) return ok("unknown");
    return ok(tx.status === "done" ? "done" : "pending");
  }
}
