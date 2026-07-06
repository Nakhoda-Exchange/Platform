# Deposit — API contract

Port: `lib/core/application/wallet/ports/wallet-repository.port.ts` (deposit half) ·
Adapter: `lib/infrastructure/wallet/http-wallet.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## GET `/wallet/cards` — auth

```json
// 200
[{ "id": "card_1", "number": "6037997599571347" }]
```

## POST `/wallet/cards` — auth

The frontend Luhn-validates; re-validate AND verify the card belongs to the
user's verified identity (own-name rule from the terms).

```json
// request
{ "number": "6037997599571347" }
// 200
{ "id": "card_1", "number": "6037997599571347" }
```

Errors: `INVALID_CARD` (422), `CARD_NOT_OWNED` (422 — «کارت باید به نام خودتان باشد.»).

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

## GET `/wallet/deposit-address/{coinId}` — auth

```json
// 200
{ "address": "bc1qxy2…", "network": "بیت‌کوین (BTC)" }
```

`network` is the Persian label shown verbatim (with the wrong-network warning).
