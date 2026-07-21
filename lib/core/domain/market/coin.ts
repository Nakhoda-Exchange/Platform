/** A tradable coin as shown in the market screens. */
export interface Coin {
  id: string;
  name: string; // provider/display name (may be English for discovered tokens)
  // Operator-set Persian display name. Optional/nullable: absent when unset, in
  // which case the UI falls back to `name` (or `symbol`). Prefer this when set.
  nameFa?: string | null;
  symbol: string; // e.g. BTC — CANONICAL ticker; the identifier for API calls/keys
  // Operator-set display alias for the ticker (e.g. TON → GRAM). Optional/nullable:
  // absent when unset. Purely a DISPLAY label — the canonical `symbol` stays the
  // identifier everywhere (order submission, balance keys, routes). Prefer this
  // over `symbol` ONLY when rendering the ticker to the user.
  displaySymbol?: string | null;
  iconUrl: string; // e.g. /coins/btc.png ("" → a brand letter-badge fallback)
  // Prices are decimal STRINGS on the wire (full precision preserved) and are
  // NULLABLE: `null` means the price is UNAVAILABLE — render an «unavailable»
  // state («قیمت در دسترس نیست» / «—»), NEVER 0 and NEVER a stale figure. Parse
  // with `parsePrice` only for formatting/computation. (Live WS ticks stay numeric.)
  priceIrt: string | null; // price in Toman (decimal string; null = unavailable)
  priceUsd: string | null; // price in USD (decimal string; null = unavailable)
  change24h: number; // signed 24h change percent (e.g. 3.2 / -2.1)
  marketCap: number; // market cap in همت (هزار میلیارد تومان)
  isNew: boolean; // recently listed
  // Asset class: a native L1 «کوین» (coin) vs an on-chain contract «توکن»
  // (token). Optional because the market feed may omit it for coins from a
  // thinner source; the PDP renders the kind badge only when it is set.
  kind?: "coin" | "token";
  // The chain the token lives on (e.g. "solana", "ethereum"). Null/absent for
  // native L1 coins; the PDP shows a chain badge only when it is set.
  chainId?: string | null;
  // On-chain contract address (tokens only). Null/absent for native coins; the
  // PDP shows the copyable contract row only when it is set.
  contractAddress?: string | null;
  // Fully-diluted valuation in همت (like `marketCap`). Null/absent when unknown
  // (native coins, sparse rows); the PDP hides the FDV row rather than show 0.
  fdv?: number | null;
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

/**
 * The ticker label to SHOW the user. Prefers the operator-set display alias
 * (`displaySymbol`, e.g. GRAM), falling back to the canonical `symbol` (TON).
 * Display only — never use this as an identifier for API calls, keys, or routes;
 * those must always use the canonical `symbol`.
 */
export function coinDisplaySymbol(
  coin: Pick<Coin, "displaySymbol" | "symbol">,
): string {
  return coin.displaySymbol?.trim() || coin.symbol;
}
