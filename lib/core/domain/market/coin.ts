/** A tradable coin as shown in the market screens. */
export interface Coin {
  id: string;
  name: string; // Persian name, e.g. «بیت‌کوین»
  symbol: string; // e.g. BTC
  iconUrl: string; // e.g. /coins/btc.png ("" → a brand letter-badge fallback)
  priceIrt: number; // price in Toman
  priceUsd: number; // price in USD
  change24h: number; // signed 24h change percent (e.g. 3.2 / -2.1)
  marketCap: number; // market cap in همت (هزار میلیارد تومان)
  isNew: boolean; // recently listed
  // Asset class: a native L1 «کوین» (coin) vs an on-chain contract «توکن»
  // (token). Optional because the market feed may omit it for coins from a
  // thinner source; the PDP renders the kind badge only when it is set.
  kind?: "coin" | "token";
}
