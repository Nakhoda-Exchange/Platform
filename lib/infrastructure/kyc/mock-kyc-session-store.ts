import type { KycSessionStore } from "@/lib/core/application/kyc/ports/kyc-session-store.port";
import type { Identity } from "@/lib/core/domain/kyc/identity";

/**
 * In-memory pending-KYC store keyed by an opaque UUID. Registered as a singleton
 * so the map survives between the submit and confirm requests. Per-process and
 * not production-shaped — swap for a real session/cache store (Redis, etc.) via
 * the DI composition root when the backend lands.
 */
export class MockKycSessionStore implements KycSessionStore {
  private readonly pending = new Map<string, Identity>();

  async save(identity: Identity): Promise<string> {
    const id = crypto.randomUUID();
    this.pending.set(id, identity);
    return id;
  }

  async get(id: string): Promise<Identity | null> {
    return this.pending.get(id) ?? null;
  }

  async clear(id: string): Promise<void> {
    this.pending.delete(id);
  }
}
