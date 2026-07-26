# Portfolio — API contract

Port: `lib/core/application/portfolio/ports/portfolio-repository.port.ts` ·
Adapter: `lib/infrastructure/portfolio/http-portfolio.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

All money/quantity fields are **decimal strings** (`numeric(38,18)`), parsed with
`parsePrice` before arithmetic. This is also the source of tradable balances —
`http-trade.repository.ts` derives `getBalances()` from this same `/portfolio`
snapshot (there is no `GET /trade/balances`).

## GET `/portfolio` — auth

```jsonc
// 200 — PortfolioSnapshot
{
  "availableIrt": "250000000", // spendable cash, Toman (decimal string)
  "pendingWithdrawIrt": "20000000", // reserved by in-review IRT withdrawals
  "holdings": [
    {
      "coin": {
        "id": "btc",
        "name": "بیت‌کوین",
        "symbol": "BTC",
        "iconUrl": "https://cdn…/btc.png",
        "change24h": 3.2,
      },
      "amount": "0.0015", // units held (decimal string)
      "valueIrt": "5850000", // amount × price, Toman (decimal string)
      "costIrt": "4500000", // cost basis — profit = value − cost
    },
  ],
}
```

Totals/profit percentages are computed frontend-side from this snapshot — send
facts, not derived numbers. Holdings are keyed by **UPPERCASE symbol** in the
trade context (the canonical identifier), not `coin.id`.

## Balance model — available / locked (#73)

`availableIrt` here is the **spendable** cash and, by contract, is **net of every
lock**: `available = total − locked − pendingWithdraw`. Meaning of the parts:

- **`pendingWithdrawIrt`** — IRT reserved by in-review fiat withdrawals (the only
  lock surfaced today).
- **`locked` (open-order reserve)** — the gap in the current model. An accepted
  order reserves its spend (IRT for a BUY, coin units for a SELL), but the
  snapshot exposes only a single number per asset, so during the
  `pending → open` window the **same balance can be spent twice** (a second order
  or a withdrawal). This is a go-live double-spend risk (#73).

**Required contract:** expose a per-asset `available`/`locked` split so
`availableIrt` (here and everywhere else it appears) is provably
`total − locked − pendingWithdraw`, with the reserve **locked on order
acceptance** and **released on the terminal state** (see the refund-timing table
in `doc/trade/api.md`). Suggested shape — a follow-up; `PortfolioSnapshot` does
not carry it yet:

```jsonc
{
  "availableIrt": "230000000",   // = total − locked − pendingWithdraw
  "lockedIrt": "20000000",       // reserved by open BUY orders
  "pendingWithdrawIrt": "20000000",
  "holdings": [
    { "coin": { … }, "amount": "0.0015", "lockedAmount": "0.0005", … }
  ]
}
```

## GET `/portfolio/history` — auth

Account value over time for the wallet chart, keyed by range. Money fields are
decimal strings.

```jsonc
// 200 — PortfolioHistory
{
  "daily":   [ { "at": 1783250000000, "valueIrt": "262838800",
                 "event": { "type": "deposit", "amountIrt": "50000000" } }, … ],
  "weekly":  [ … ],
  "monthly": [ … ]
}
```

`at` is **epoch ms**, points oldest → newest, the newest value must equal the
live total (cash + holdings). `event` is optional — set when a deposit or
withdrawal landed at that point (the chart annotates it); `amountIrt` is always
positive, sign derived from `type`.
