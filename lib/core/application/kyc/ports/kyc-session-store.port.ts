import type { Identity } from "@/lib/core/domain/kyc/identity";

/**
 * Server-side holding area for an in-progress KYC. The identity returned by the
 * inquiry is stashed here under an opaque id; only that id travels to the client
 * (in an httpOnly cookie), so the sensitive fields are never exposed or editable
 * in the URL.
 */
export interface KycSessionStore {
  /** Stash an identity and return the opaque id used to retrieve it. */
  save(identity: Identity): Promise<string>;
  /** Look up a stashed identity, or `null` if unknown/expired. */
  get(id: string): Promise<Identity | null>;
  /** Drop a stashed identity once the flow is done. */
  clear(id: string): Promise<void>;
}
