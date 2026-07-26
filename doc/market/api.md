# Market — API contract

Port: `lib/core/application/market/ports/market-repository.port.ts` ·
Adapter: `lib/infrastructure/market/http-market.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

Prices are **decimal strings** and **nullable** (`null` = unavailable, never `0`
or stale). See `lib/core/domain/market/coin.ts` and `price.ts`.

## GET `/market/coins`

The full tradable list (PLP). Public.

```jsonc
// 200 — array of Coin
[
  {
    "id": "btc", // opaque id (lowercase); discovered tokens: "dx_<contract>"
    "name": "Bitcoin", // provider/display name (may be English)
    "nameFa": "بیت‌کوین", // optional operator Persian name; preferred when set
    "symbol": "BTC", // CANONICAL ticker — the identifier for orders/keys/routes
    "displaySymbol": "BTC", // optional display alias (e.g. TON→GRAM); display only
    "iconUrl": "https://cdn…/btc.png", // "" → brand letter-badge fallback
    "priceIrt": "3900000000", // decimal string, or null = unavailable
    "priceUsd": "65800", // decimal string, or null = unavailable
    "change24h": 3.2, // signed percent (number)
    "marketCap": 85000, // در همت (هزار میلیارد تومان)
    "isNew": false,
    // optional, PDP-conditional: rendered only when present
    "kind": "coin", // "coin" (native L1) | "token" (on-chain)
    "chainId": "solana", // tokens only; null/absent for native coins
    "contractAddress": "…", // tokens only
    "fdv": 90000, // همت; null/absent when unknown
  },
]
```

## GET `/market/coins/{idOrSymbol}`

The PDP payload. Public. `{idOrSymbol}` is a **lowercased** id (`btc`) or symbol.
Unknown coin → **404** (code `COIN_NOT_FOUND`, or bare `HTTP_404`); the adapter
maps either to `null` → the not-found screen.

```jsonc
// 200 — CoinDetail
{
  "coin": { …Coin as above… },
  "high24h": "3950000000",  // decimal string, or null = unavailable
  "low24h": "3820000000",   // decimal string, or null = unavailable
  "volume24h": 5100,        // همت (number)
  "description": "بیت‌کوین نخستین…",
  "series":  [ { "at": 1783250000000, "priceIrt": 3890000000 }, … ],
  "candles": [ { "at": 1783250000000, "open": 1, "high": 2, "low": 1, "close": 2 }, … ],
  "holdersCount": 128000    // optional, best-effort; null/absent → row hidden
}
```

**Chart shape (flat, 24h-only).** `series`/`candles` are **flat arrays** for the
default **24h** range — NOT range-keyed records. The adapter reshapes them into
`{ "24h": [...] }` internally so the PDP (`series?.["24h"]`) renders; empty/absent
arrays collapse to the graceful "no chart yet" state. The other ranges (`7d`,
`1m`, `1y`) come from the dedicated chart endpoint below, not from this payload.
Chart point values (`priceIrt`, OHLC) are **numbers**; `at` is **epoch ms**. The
newest close/price should equal the live `priceIrt`.

## GET `/market/coins/{idOrSymbol}/chart?timeframe={range}` — public

One range's chart, fetched on demand when the user switches timeframe.
`timeframe ∈ 24h | 7d | 1m | 1y`.

```jsonc
// 200 — CoinChart (both arrays oldest → newest; empty when no history for the range)
{
  "series":  [ { "at": 1783250000000, "priceIrt": 3890000000 }, … ],
  "candles": [ { "at": 1783250000000, "open": 1, "high": 2, "low": 1, "close": 2 }, … ]
}
```

Sparse payloads return **empty arrays** (never null fields) → the PDP shows a
clear "no data for this range yet" state. Unknown coin → 404 → `null`.
