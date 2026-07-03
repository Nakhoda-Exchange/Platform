/** A tradable coin as shown in the market list (PLP). */
export interface Coin {
  id: string;
  name: string; // Persian name, e.g. «بیت‌کوین»
  symbol: string; // e.g. BTC
  iconUrl: string; // optional; empty → a brand letter-badge is shown
  priceIrt: number; // price in Toman
  priceUsd: number; // price in USD
  change24h: number; // signed 24h change percent (e.g. 3.2 / -2.1)
}
