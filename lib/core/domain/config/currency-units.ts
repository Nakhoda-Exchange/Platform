/**
 * Currency unit labels, served by the backend (platform config) — the UI
 * never hardcodes them. The backend can rebrand/localize units without an
 * app release.
 */
export interface CurrencyUnits {
  irt: string; // e.g. «تومان»
  usd: string; // e.g. «دلار»
}
