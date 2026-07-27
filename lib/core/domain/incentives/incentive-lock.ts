/**
 * A gift that has been PAID but may not yet be WITHDRAWN.
 *
 * The money is fully tradeable the whole time — a lock gates the exit, not the
 * use. That matters for how we word things to the user: «قابل برداشت نیست», not
 * «مسدود است», because they can trade it today and in fact usually must, since
 * the volume condition is met by trading.
 */
export interface IncentiveLock {
  id: string;
  /** Toman locked. For a coin gift, its value when credited — never re-marked. */
  amountIrt: string;
  unlockAt: string | null;
  requiredVolumeIrt: string | null;
  requiredDepositIrt: string | null;
  /** When unmet terms are clawed back; null when the lock never expires. */
  forfeitAt: string | null;
  /** Settled buy + sell notional since the gift landed. */
  volumeIrt: string;
  /** Own-money deposits since the gift landed. */
  depositIrt: string;
  /**
   * Conditions still open. Release is a CLIFF: while this is non-empty NOTHING
   * of the gift is withdrawable, however close the progress bar looks. Showing
   * progress without saying that would be a lie of omission.
   */
  unmet: LockCondition[];
  /** True when the user may abandon the gift to clear the floor for good. */
  canForfeit: boolean;
}

export type LockCondition = "time" | "volume" | "deposit";

export interface IncentiveLocks {
  /**
   * Total Toman that may not be withdrawn. Subtract from the available balance
   * to get what can actually leave.
   */
  lockedIrt: string;
  items: IncentiveLock[];
}

export const NO_LOCKS: IncentiveLocks = { lockedIrt: "0", items: [] };

/** Persian names for what is still outstanding. */
export const LOCK_CONDITION_LABELS: Record<LockCondition, string> = {
  time: "گذشت زمان",
  volume: "حجم معاملات",
  deposit: "واریز از حساب خودتان",
};

/** The outcome of abandoning a lock. */
export interface ForfeitedLock {
  /** `released` ⇒ the terms were already met and nothing was taken back. */
  outcome: "released" | "forfeited";
  recoveredIrt: string;
}

/** Whole days left, floored at 0 — «۱۲ روز مانده» reads better than an instant. */
export function daysUntil(
  iso: string | null,
  now: Date = new Date(),
): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return null;
  return Math.max(0, Math.ceil((target - now.getTime()) / 86_400_000));
}

/**
 * Progress toward a numeric condition as a 0–1 fraction, for a progress bar.
 * A null requirement means the condition does not apply, so there is no bar to
 * draw — distinct from a requirement met at 0%.
 */
export function progressRatio(
  actual: string,
  required: string | null,
): number | null {
  if (required === null) return null;
  const target = Number(required);
  if (!Number.isFinite(target) || target <= 0) return null;
  return Math.min(1, Math.max(0, Number(actual) / target));
}
