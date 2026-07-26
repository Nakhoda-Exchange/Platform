/**
 * A user's trade preferences.
 *
 * `slippageBps` OVERRIDES the per-coin tolerance the exchange configured — the
 * user's money is the money at risk, so their explicit choice wins.
 *
 * `null` means NO PREFERENCE (use the coin's own resolved tolerance) and is not
 * the same as zero: zero would fail every order.
 */
export interface TradePreferences {
  slippageBps: number | null;
  /** Confirm-sheet validity window, seconds. UI only — execution is unaffected. */
  confirmSeconds: number;
}

/** What a user who has never opened the settings sheet gets. */
export const DEFAULT_TRADE_PREFERENCES: TradePreferences = {
  slippageBps: null,
  confirmSeconds: 30,
};

/**
 * Above this, a tolerance stops protecting the user and starts inviting an MEV
 * sandwich: a bot can move the price by almost the full tolerance and keep the
 * difference. Not a cap — the setting is a genuine full override — but the point
 * at which the UI must say so plainly before the user commits.
 */
export const RISKY_SLIPPAGE_BPS = 500; // 5%
