# Withdraw — API contract

Port: `lib/core/application/wallet/ports/wallet-repository.port.ts` (withdraw half) ·
Adapter: `lib/infrastructure/wallet/http-wallet.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## GET `/wallet/withdraw-fees` — auth

Crypto network fee per coin id, in units of that coin.

```json
// 200
{ "btc": 0.0002, "eth": 0.003, "usdt": 1 }
```

## POST `/wallet/withdrawals/irt` — auth

Toman to one of the user's own cards. Re-validate: min ۵۰۰٬۰۰۰ تومان,
amount ≤ cash balance, card ownership. **Reserve the funds and keep the
request `pending`** (back-office approval model) — the UI states this.

```json
// request
{ "cardId": "card_1", "amountIrt": 2000000 }
// 200
{ "id": "wd_1" }
```

Errors: `NO_CARD`, `EMPTY_AMOUNT`, `BELOW_MIN_WITHDRAW`, `INSUFFICIENT_IRT` — 422.

## POST `/wallet/withdrawals/crypto` — auth

```json
// request
{
  "coinId": "btc",
  "address": "bc1qxy2…",
  "amountCoin": 0.001,
  "amountIrt": 3900000     // informative IRT equivalent at request time
}
// 200
{ "id": "wd_2" }
```

Errors: `INVALID_ADDRESS`, `EMPTY_AMOUNT`, `UNKNOWN_COIN`, `BELOW_FEE`
(amount must exceed the network fee), `INSUFFICIENT_COIN` — 422.

## Notes for backend

- Both paths debit/reserve immediately and surface as `pending` in
  `/wallet/transactions`; approval/failure later flips the status
  (`done`/`failed`, releasing funds on failure).
- OTP/2FA confirmation for withdrawals is a planned frontend step — design
  the endpoints to accept an optional `otp` field forward-compatibly.
