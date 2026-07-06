# Trade — API contract

Port: `lib/core/application/trade/ports/trade-repository.port.ts` ·
Adapter: `lib/infrastructure/trade/http-trade.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## GET `/trade/balances` — auth

```json
// 200
{ "availableIrt": 250000000, "coinAmounts": { "btc": 0.0015, "eth": 0.02 } }
```

## POST `/trade/orders` — auth

Market order. The frontend pre-computes with FEE_RATE = 0.35% for instant
feedback, but the BACKEND IS AUTHORITATIVE — re-validate everything: min
order (۵۰۰٬۰۰۰ تومان), balances, and the fee.

```json
// request
{
  "coinId": "btc",
  "side": "buy",             // buy | sell
  "amountCoin": 0.000498,     // buy: net of fee; sell: gross units sold
  "totalIrt": 2000000,        // what the user entered
  "feeIrt": 7000              // 0.35% of totalIrt — verify, don't trust
}
// 200 — PlacedOrder
{
  "id": "ord_1", "side": "buy", "coinId": "btc", "symbol": "BTC",
  "name": "بیت‌کوین", "amountCoin": 0.000498, "totalIrt": 2000000,
  "feeIrt": 7000, "priceIrt": 4000000000
}
```

Errors: `EMPTY_AMOUNT`, `BELOW_MIN_ORDER`, `UNKNOWN_COIN`,
`INSUFFICIENT_IRT`, `INSUFFICIENT_COIN` (all 422 with Persian messages —
the exact codes/messages already exist in `place-order.use-case.ts`).

## Notes for backend

- Fee semantics: buyers pay the fee out of `totalIrt` (coins bought with the
  remainder); sellers receive `totalIrt − feeIrt`. Fees feed the referral
  pool (`doc/referral/api.md`).
- A filled order must appear in `/wallet/transactions` immediately.
