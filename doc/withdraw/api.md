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

## OTP second factor — bound to amount + IBAN (#69)

When the backend requires a `withdraw` OTP for the user, the flow is two-step and
the challenge is **bound server-side to the specific `{ ibanId, amountIrt }`**, so
the code approves _this_ withdrawal — not merely _a_ withdrawal within a validity
window:

```jsonc
// 1) request the OTP — bound to this exact amount + destination
// POST /wallet/withdrawals/irt/otp        (or the auth OTP endpoint, purpose "withdraw")
// request
{ "ibanId": "iban_1", "amountIrt": 2000000 }
// 200
{ "challengeId": "chl_1", "resendAfterSeconds": 60 }

// 2) submit the withdrawal, echoing the challenge + the typed code
// POST /wallet/withdrawals/irt
{ "ibanId": "iban_1", "amountIrt": 2000000, "challengeId": "chl_1", "otp": "123456" }
```

The backend MUST reject the submit if `{ibanId, amountIrt}` differ from what the
`challengeId` was issued for. The mobile is read from the authenticated profile
server-side (never trusted from the client).

> **Rate-limiting is server-side (#69).** The UI resend countdown is UX only. The
> real anti-abuse control (SMS-bombing / brute-force) is a **429** from the OTP
> request/verify endpoints — never rely on the client timer.

## Notes for backend

- The Toman path debits/reserves immediately and surfaces as `pending` in
  `/wallet/transactions`; approval/failure later flips the status
  (`done`/`failed`, releasing funds on failure).
- **Populate `withdrawals.approved_at` (#75)** on back-office approval — it is
  currently unset and is required for reconciliation and user statements.

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
