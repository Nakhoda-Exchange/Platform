# History — API contract

Port: `lib/core/application/wallet/ports/transactions-repository.port.ts` ·
Adapter: `lib/infrastructure/wallet/http-transactions.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## GET `/wallet/transactions` — auth

Everything that moved money, any order (the frontend sorts desc and filters
by type client-side for now — add `?type=` server-side when lists grow).

```jsonc
// 200 — array of Transaction
[
  {
    "id": "t_1",
    "type": "buy", // deposit | withdraw | buy | sell | reward
    "status": "done", // pending | done | failed  (see gap below)
    "at": "2026-07-06T09:30:00Z", // ISO 8601 UTC; parsed to a Date client-side

    "amountIrt": "1600000", // decimal string, always positive; sign from type

    // trade + reward rows only:
    "symbol": "TON", // canonical ticker
    "coinName": "تون‌کوین",
    "amountCoin": "5", // decimal string
    "iconUrl": "https://cdn…/ton.png",
  },
]
```

`amountIrt`/`amountCoin` are **decimal strings** (conventions); `at` is an ISO
string the adapter parses to a `Date`. `reward` rows are growth-incentive payouts
(«پاداش دعوت») — Toman only, no coin fields required.

### Status gap: no `expired`, no deposit mismatch (#72/#74)

`Transaction.status` is only `pending | done | failed`
(`lib/core/domain/wallet/transaction.ts`). Two terminal outcomes have **nowhere
to land** in history today and must be mappable (a required follow-up):

- an **`expired`** order (realtime `trade.update` reaches `expired` once
  `expiresAt` passes, and a resting order can lapse) — money was reserved and the
  order never filled; history should show it as terminal, not stuck `pending`.
- a deposit that ends **`expired`** or **`amount_mismatch`** (real cash already
  left the user's bank) — see `doc/deposit/api.md`. Its history row needs a
  terminal status and, for a mismatch, the observed amount.

Add an `expired` transaction status (and surface the deposit mismatch amount) so
every terminal state has a home in `/wallet/transactions`.
