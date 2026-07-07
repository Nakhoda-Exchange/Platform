# History — API contract

Port: `lib/core/application/wallet/ports/transactions-repository.port.ts` ·
Adapter: `lib/infrastructure/wallet/http-transactions.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## GET `/wallet/transactions` — auth

Everything that moved money, any order (the frontend sorts desc and filters
by type client-side for now — add `?type=` server-side when lists grow).

```json
// 200 — array of Transaction
[
  {
    "id": "t_1",
    "type": "buy", // deposit | withdraw | buy | sell | reward
    "status": "done", // pending | done | failed
    "at": "2026-07-06T09:30:00Z",
    "amountIrt": 1600000, // always positive; sign is derived from type

    // trade + reward rows only:
    "symbol": "TON",
    "coinName": "تون‌کوین",
    "amountCoin": 5,
    "iconUrl": "https://cdn…/ton.png"
  }
]
```

`reward` rows are referral payouts («پاداش دعوت») — Toman only, no coin fields
required.
