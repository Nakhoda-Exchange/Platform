# Deposit — API contract

Port: `lib/core/application/wallet/ports/wallet-repository.port.ts` (deposit half) ·
Adapter: `lib/infrastructure/wallet/http-wallet.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

> **V0 scope:** crypto deposit is removed — see the **Removed in V0** section
> at the bottom of this file. Only the Toman endpoints are implemented by the
> HTTP adapter for V0.

## Saved cards

Listing/adding/removing/setting-primary a card is the **bank-account**
feature's contract, not deposit's — see
[`doc/bank-account/api.md`](../bank-account/api.md) (`GET/POST /wallet/cards`,
`PUT /wallet/cards/{id}/primary`, `DELETE /wallet/cards/{id}`). Deposit only
consumes the resulting `cardId`.

## POST `/wallet/deposits/card` — auth

Start a card-to-card deposit. **The company's destination card is returned
here, per deposit — never hardcoded client-side.**

```json
// request
{ "cardId": "card_1", "amountIrt": 1000000 }
// 200 — CardDeposit
{
  "id": "dep_1",
  "companyCard": "6219861900045875",
  "companyName": "شرکت ناخدا",
  "expiresInSeconds": 600
}
```

Errors: `NO_CARD`, `EMPTY_AMOUNT`, `BELOW_MIN_DEPOSIT` (min ۱۰۰٬۰۰۰ تومان) — 422.

## GET `/wallet/deposits/{id}/status` — auth

Polled (~3s) while the countdown runs, until the bank transfer is observed.

```json
// 200
{ "status": "pending" } // pending | done | unknown
```

On `done` the balance must already be credited and the transaction flipped in
`/wallet/transactions`.

## Removed in V0 — GET `/wallet/deposit-address/{coinId}`

Crypto deposit is out of scope for V0. Deferred, not forgotten — the
endpoint below is documented for when the coin deposit flow returns; the
HTTP adapter must not call it in V0.

```json
// auth
// 200
{ "address": "bc1qxy2…", "network": "بیت‌کوین (BTC)" }
```

`network` is the Persian label shown verbatim (with the wrong-network warning).
