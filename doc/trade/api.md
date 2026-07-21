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

---

## Async order lifecycle (#154 PR5) — the client contract

The Platform client now speaks the async order lifecycle. Submit, status, list
and cancel all live under `/orders` (the adapter posts submits to **`POST
/orders`**, not the legacy `/trade/orders` — see the assumption note below).

### POST `/orders` — auth — submit

The current wire DTO the adapter sends (unchanged from today plus the two LIMIT
fields):

```jsonc
// MARKET (backward-compatible)
{ "symbol": "BTC", "side": "BUY", "orderType": "MARKET",
  "amount": "2000000", "amountUnit": "IRT", "requestedPrice": "4000000000" }

// LIMIT — SPEND-committed. BUY commits IRT; SELL commits the coin amount.
{ "symbol": "BTC", "side": "BUY", "orderType": "LIMIT",
  "targetPrice": "3500000000", "amount": "2000000", "amountUnit": "IRT" }
{ "symbol": "BTC", "side": "SELL", "orderType": "LIMIT",
  "targetPrice": "4500000000", "amount": "0.5", "amountUnit": "BTC" }
```

`Idempotency-Key` header per submit. `amount`/`targetPrice` are whole-Toman
strings (coin `amount` is a decimal string). Two response shapes:

```jsonc
// 200 — synchronous fill (MARKET today, async flag OFF)
{ "status": "SETTLED", "orderId": "ord_1" }
// 202 — accepted, now rests/pends (LIMIT always; MARKET once async is ON)
{ "status": "ACCEPTED", "orderId": "ord_1", "phase": "pending" }
// 200 — rejected
{ "status": "REJECTED", "reason": "NO_LIQUIDITY" }
```

On 202 the client polls `GET /orders/{orderId}` (~1s interval, bounded budget)
until terminal; a LIMIT gets a short budget then hands off to the open-orders
list.

### GET `/orders/{orderId}` — auth — status

```jsonc
{
  "orderId": "ord_1",
  "status": "RESERVED", // RESERVED = still resting/pending
  "reason": null,
  "filledAmount": null,
  "totalIrt": null,
}
// terminal: status ∈ SETTLED | REJECTED | CANCELLED
```

### GET `/orders?status=open` — auth — open (resting) orders

```jsonc
{
  "orders": [
    {
      "orderId": "ord_1",
      "side": "BUY",
      "symbol": "BTC",
      "coinDisplaySymbol": "BTC",
      "orderType": "LIMIT",
      "targetPrice": "3500000000",
      "amount": "2000000",
      "amountCurrency": "IRT",
      "status": "RESERVED",
      "createdAt": "2026-07-21T10:00:00Z",
      "expiresAt": null,
    },
  ],
}
```

### POST `/orders/{orderId}/cancel` — auth — cancel

`200` on success (order CANCELLED, reserve released); **`409`** if it already
executed → the client maps this to `ORDER_ALREADY_EXECUTED`, drops the row and
refreshes the list.

### Assumptions (please confirm)

- **Submit path** moved to `POST /orders` to sit with the rest of the lifecycle
  (task spec: `POST /v1/orders`). If the backend keeps submit at
  `/trade/orders`, only the path constant in `http-trade.repository.ts` changes.
- **LIMIT SELL amount unit** is the coin symbol (`amountUnit: "BTC"`), since a
  LIMIT is SPEND-committed and TARGET-unit limits are rejected.
