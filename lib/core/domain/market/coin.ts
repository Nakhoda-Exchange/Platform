/** A tradable coin as shown in the market screens. */
export interface Coin {
  id: string;
  name: string; // provider/display name (may be English for discovered tokens)
  // Operator-set Persian display name. Optional/nullable: absent when unset, in
  // which case the UI falls back to `name` (or `symbol`). Prefer this when set.
  nameFa?: string | null;
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

/**
 * The name to show the user. Prefers the operator-set Persian name (`nameFa`),
 * falling back to `name` and finally `symbol` so a row never renders empty.
 * Discovered tokens carry an English provider `name`; when an operator sets a
 * Persian `nameFa`, that becomes the primary displayed name across the app.
 */
export function coinDisplayName(
  coin: Pick<Coin, "nameFa" | "name" | "symbol">,
): string {
  return coin.nameFa?.trim() || coin.name?.trim() || coin.symbol;
}
