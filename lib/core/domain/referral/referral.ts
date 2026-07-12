/**
 * «کد دعوت ناخدا» — fee-share referral tiers (doc/referral/PRD.md). Rewards
 * are ONLY a share of trading fees collected from invitees; the share is
 * capped at 50% so every referred trade stays profitable for the house.
 */
export const REFERRAL_TIERS = [
  { minActive: 0, sharePercent: 30 },
  { minActive: 10, sharePercent: 40 },
  { minActive: 50, sharePercent: 50 },
] as const;

export interface ReferralTier {
  minActive: number;
  sharePercent: number;
}

/** The current tier for a number of active invitees, plus the next rung. */
export function tierFor(activeCount: number): {
  current: ReferralTier;
  next?: ReferralTier;
} {
  let current: ReferralTier = REFERRAL_TIERS[0];
  for (const tier of REFERRAL_TIERS) {
    if (activeCount >= tier.minActive) current = tier;
  }
  const next = REFERRAL_TIERS.find((t) => t.minActive > activeCount);
  return { current, next };
}

/** One person who signed up with your code. */
export interface Invitee {
  name: string; // display name, masked by the backend, e.g. «رضا م.»
  joinedAt: string; // ISO date they signed up
  active: boolean; // KYC-passed + traded recently (counts toward your tier)
}

/** What the referral screen shows. */
export interface ReferralOverview {
  code: string; // e.g. ALI-1234
  invitedCount: number; // everyone who signed up with the code
  activeCount: number; // KYC-passed + traded in the last 30 days
  earnedIrt: number; // lifetime rewards, Toman
  sharePercent: number; // current tier's share of invitee fees
  nextTier?: ReferralTier; // absent at the cap
  invitees: Invitee[]; // the people you invited (newest first)
}
