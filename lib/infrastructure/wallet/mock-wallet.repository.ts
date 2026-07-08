import type { WalletRepository } from "@/lib/core/application/wallet/ports/wallet-repository.port";
import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import type { Iban } from "@/lib/core/domain/wallet/bank-account";
import type {
  CardDeposit,
  DepositStatus,
} from "@/lib/core/domain/wallet/deposit";
import { fail, ok, type Result } from "@/lib/core/domain/shared/result";
import { wallet } from "../portfolio/mock-wallet-state";

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The user's saved cards + IBANs (per-process; start empty so the add flow is
// the first-run path). The first instrument added becomes primary.
const CARDS: BankCard[] = [];
const IBANS: Iban[] = [];

// Point `primary` at `id` within a same-kind list; if `id` is gone, promote the
// first remaining one so there's always exactly one primary when non-empty.
function repoint<T extends { id: string; primary: boolean }>(
  list: T[],
  id: string,
): void {
  const target = list.some((x) => x.id === id) ? id : list[0]?.id;
  for (const item of list) item.primary = item.id === target;
}

// How long the mock "backend" takes to observe the card-to-card transfer and
// emit the deposit-submitted event.
const MOCK_SETTLE_MS = 15_000;

export class MockWalletRepository implements WalletRepository {
  async listCards(): Promise<Result<BankCard[]>> {
    await delay(150);
    return ok([...CARDS]);
  }

  async addCard(number: string, ownerName: string): Promise<Result<BankCard>> {
    await delay(250);
    const existing = CARDS.find((c) => c.number === number);
    if (existing) return ok(existing);
    const card: BankCard = {
      id: crypto.randomUUID(),
      number,
      ownerName,
      primary: CARDS.length === 0, // first card is primary
      status: "verified", // ownership already confirmed by the inquiry
    };
    CARDS.push(card);
    return ok(card);
  }

  async setPrimaryCard(id: string): Promise<Result<void>> {
    await delay(150);
    if (!CARDS.some((c) => c.id === id)) {
      return fail("CARD_NOT_FOUND", "کارت پیدا نشد.");
    }
    repoint(CARDS, id);
    return ok(undefined);
  }

  async removeCard(id: string): Promise<Result<void>> {
    await delay(150);
    const idx = CARDS.findIndex((c) => c.id === id);
    if (idx === -1) return fail("CARD_NOT_FOUND", "کارت پیدا نشد.");
    const wasPrimary = CARDS[idx].primary;
    CARDS.splice(idx, 1);
    if (wasPrimary && CARDS.length) repoint(CARDS, CARDS[0].id);
    return ok(undefined);
  }

  async listIbans(): Promise<Result<Iban[]>> {
    await delay(150);
    return ok([...IBANS]);
  }

  async addIban(value: string, ownerName: string): Promise<Result<Iban>> {
    await delay(250);
    const existing = IBANS.find((i) => i.value === value);
    if (existing) return ok(existing);
    const iban: Iban = {
      id: crypto.randomUUID(),
      value,
      ownerName,
      primary: IBANS.length === 0,
      status: "verified",
    };
    IBANS.push(iban);
    return ok(iban);
  }

  async setPrimaryIban(id: string): Promise<Result<void>> {
    await delay(150);
    if (!IBANS.some((i) => i.id === id)) {
      return fail("IBAN_NOT_FOUND", "شبا پیدا نشد.");
    }
    repoint(IBANS, id);
    return ok(undefined);
  }

  async removeIban(id: string): Promise<Result<void>> {
    await delay(150);
    const idx = IBANS.findIndex((i) => i.id === id);
    if (idx === -1) return fail("IBAN_NOT_FOUND", "شبا پیدا نشد.");
    const wasPrimary = IBANS[idx].primary;
    IBANS.splice(idx, 1);
    if (wasPrimary && IBANS.length) repoint(IBANS, IBANS[0].id);
    return ok(undefined);
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

  async requestIrtWithdraw(
    _ibanId: string,
    amountIrt: number,
  ): Promise<Result<{ id: string }>> {
    await delay();
    const id = crypto.randomUUID();
    // Reserve the funds; a back-office approves it, so it stays pending.
    wallet.irt -= amountIrt;
    wallet.transactions.push({
      id,
      type: "withdraw",
      status: "pending",
      at: new Date(),
      amountIrt,
    });
    return ok({ id });
  }

  async getDepositStatus(depositId: string): Promise<Result<DepositStatus>> {
    await delay(100);
    const tx = wallet.transactions.find((t) => t.id === depositId);
    if (!tx) return ok("unknown");
    return ok(tx.status === "done" ? "done" : "pending");
  }
}
