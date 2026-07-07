# Market — API contract

Port: `lib/core/application/market/ports/market-repository.port.ts` ·
Adapter: `lib/infrastructure/market/http-market.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## GET `/market/coins`

The full tradable list (PLP). Public.

```json
// 200 — array of Coin
[
  {
    "id": "btc",
    "name": "بیت‌کوین",
    "symbol": "BTC",
    "iconUrl": "https://cdn…/btc.png",
    "priceIrt": 3900000000,
    "priceUsd": 65800,
    "change24h": 3.2, // signed percent
    "marketCap": 85000, // در همت (هزار میلیارد تومان)
    "isNew": false
  }
]
```

## GET `/market/coins/{idOrSymbol}`

The PDP payload. Public. `{idOrSymbol}` is a lowercase id (`btc`) or symbol.
**404** for unknown coins (the frontend maps it to its not-found screen).

```json
// 200
{
  "coin": { …Coin as above… },
  "high24h": 3950000000,
  "low24h": 3820000000,
  "volume24h": 5100,          // همت
  "description": "بیت‌کوین نخستین…",   // short Persian blurb
  "series": {                 // line chart, oldest → newest
    "24h": [{ "at": 1783250000000, "priceIrt": 3890000000 }, …],
    "7d":  […], "1m": […], "1y": […]
  },
  "candles": {                // OHLC per range, oldest → newest
    "24h": [{ "at": 1783250000000, "open": 1, "high": 2, "low": 1, "close": 2 }, …],
    "7d":  […], "1m": […], "1y": […]
  }
}
```

`at` is **epoch ms**. Expected point counts: 24h≈24, 7d≈28, 1m≈30, 1y≈24;
the newest close/price must equal the live `priceIrt`.
