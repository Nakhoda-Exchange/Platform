/** Smallest Toman withdrawal the platform accepts. */
export const MIN_WITHDRAW_IRT = 500_000;

/** Loose sanity check for an external crypto address (real rules per network). */
export function isPlausibleCryptoAddress(value: string): boolean {
  return /^[A-Za-z0-9_-]{20,64}$/.test(value.trim());
}
