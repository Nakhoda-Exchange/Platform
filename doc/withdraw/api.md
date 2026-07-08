# Withdraw — API contract

Port: `lib/core/application/wallet/ports/wallet-repository.port.ts` (withdraw half) ·
Adapter: `lib/infrastructure/wallet/http-wallet.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

> **V0 scope:** crypto withdrawal is removed — see the **Removed in V0**
> section at the bottom of this file. Only the Toman endpoint is
> implemented by the HTTP adapter for V0.

## POST `/wallet/withdrawals/irt` — auth

Toman to one of the user's own IBANs (شبا) — Paya/Satna settle to a Sheba,
not a card. Re-validate: min ۵۰۰٬۰۰۰ تومان, amount ≤ cash balance, IBAN
ownership. **Reserve the funds and keep the request `pending`**
(back-office approval model) — the UI states this.

```json
// request
{ "ibanId": "iban_1", "amountIrt": 2000000 }
// 200
{ "id": "wd_1" }
```

Errors: `NO_IBAN`, `EMPTY_AMOUNT`, `BELOW_MIN_WITHDRAW`, `INSUFFICIENT_IRT` — 422.

## Notes for backend

- The Toman path debits/reserves immediately and surfaces as `pending` in
  `/wallet/transactions`; approval/failure later flips the status
  (`done`/`failed`, releasing funds on failure).
- OTP/2FA confirmation for withdrawals is a planned frontend step — design
  the endpoint to accept an optional `otp` field forward-compatibly.

## Removed in V0 — crypto withdrawal

Deferred, not forgotten — documented for when the coin withdrawal flow
returns; the HTTP adapter must not call these in V0.

### GET `/wallet/withdraw-fees` — auth

Crypto network fee per coin id, in units of that coin.

```json
// 200
{ "btc": 0.0002, "eth": 0.003, "usdt": 1 }
```

### POST `/wallet/withdrawals/crypto` — auth

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

Same debit/reserve + pending → done/failed model as the Toman path, plus an
optional `otp` field forward-compatibly.
