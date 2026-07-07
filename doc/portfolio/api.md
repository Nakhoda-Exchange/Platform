# Portfolio — API contract

Port: `lib/core/application/portfolio/ports/portfolio-repository.port.ts` ·
Adapter: `lib/infrastructure/portfolio/http-portfolio.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## GET `/portfolio` — auth

```json
// 200 — PortfolioSnapshot
{
  "availableIrt": 250000000,
  "pendingWithdrawIrt": 20000000, // reserved by in-review withdrawals
  "holdings": [
    {
      "coin": {
        "id": "btc",
        "name": "بیت‌کوین",
        "symbol": "BTC",
        "iconUrl": "https://cdn…/btc.png",
        "change24h": 3.2
      },
      "amount": 0.0015,
      "valueIrt": 5850000,
      "costIrt": 4500000 // cost basis — profit = value − cost
    }
  ]
}
```

Totals/profit percentages are computed frontend-side from this snapshot —
send facts, not derived numbers.

## GET `/portfolio/history` — auth

Account value over time for the wallet chart, keyed by range.

```json
// 200 — PortfolioHistory
{
  "daily":   [{ "at": 1783250000000, "valueIrt": 262838800,
                "event": { "type": "deposit", "amountIrt": 50000000 } }, …],
  "weekly":  […],
  "monthly": […]
}
```

`at` is **epoch ms**, points oldest → newest, the newest value must equal the
live total (cash + holdings). `event` is optional — set when a deposit or
withdrawal landed at that point (the chart annotates it).
