import type {
  ReferralFacts,
  ReferralRepository,
} from "@/lib/core/application/referral/ports/referral-repository.port";
import type { Invitee } from "@/lib/core/domain/referral/referral";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import { wallet } from "../portfolio/mock-wallet-state";

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Invite code: 6 random chars, uppercase letters + digits (the backend
// generates these; the mock mirrors the shape).
const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function randomCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

// The mock user's referral state (per-process). Counts derive from the invitee
// list, and earned rewards from the reward transactions in the shared wallet —
// one source of truth each. Newest invitee first.
const CODE = randomCode();
const invitees: Invitee[] = [
  { name: "مهدی کریمی", joinedAt: "2025-07-01", active: false },
  { name: "سارا احمدی", joinedAt: "2025-06-18", active: true },
  { name: "رضا محمدی", joinedAt: "2025-05-02", active: true },
];

export class MockReferralRepository implements ReferralRepository {
  async getFacts(): Promise<Result<ReferralFacts>> {
    await delay();
    const earnedIrt = wallet.transactions
      .filter((t) => t.type === "reward")
      .reduce((sum, t) => sum + t.amountIrt, 0);
    return ok({
      code: CODE,
      invitedCount: invitees.length,
      activeCount: invitees.filter((i) => i.active).length,
      earnedIrt,
      invitees,
    });
  }

  async applyCode(code: string): Promise<Result<void>> {
    await delay(150);
    // Mock: any well-formed code adds a fresh (still-pending) invitee.
    if (/^[A-Z0-9]{6}$/.test(code)) {
      invitees.unshift({
        name: "کاربر جدید",
        joinedAt: new Date().toISOString().slice(0, 10),
        active: false,
      });
    }
    return ok(undefined);
  }
}
