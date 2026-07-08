# Bank accounts — API contract

Port: `lib/core/application/wallet/ports/wallet-repository.port.ts` (cards/IBANs half) ·
Adapter: `lib/infrastructure/wallet/http-wallet.repository.ts` ·
Ownership inquiry: [`doc/kyc/api.md`](../kyc/api.md) (`/kyc/card-inquiry`,
`/kyc/iban-inquiry` — called by the use case before these endpoints ever save
anything) ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## BankCard shape

```json
{
  "id": "card_1",
  "number": "6037997599571347",
  "ownerName": "علی رضایی",
  "primary": true,
  "status": "verified"
}
```

## Iban shape

```json
{
  "id": "iban_1",
  "value": "IR820540102680020817909002",
  "ownerName": "علی رضایی",
  "primary": true,
  "status": "verified"
}
```

`status` is `"verified" | "pending"`. On add, the frontend has already run
the ownership inquiry (`/kyc/card-inquiry` / `/kyc/iban-inquiry`) and only
calls these endpoints on a confirmed match — so the record is created
`verified` unless the backend does its own async re-check, in which case
start it `pending` and flip it once confirmed (there is currently no
endpoint to poll/patch this — add one alongside the async re-check if it's
introduced).

## Cards

### GET `/wallet/cards` — auth

```json
// 200
[
  {
    "id": "card_1",
    "number": "6037997599571347",
    "ownerName": "علی رضایی",
    "primary": true,
    "status": "verified"
  }
]
```

### POST `/wallet/cards` — auth

The frontend Luhn-validates and has already confirmed ownership via
`/kyc/card-inquiry` before calling this — `ownerName` is that inquiry's
result, not user input. **Re-validate the format and re-check ownership
server-side**; never trust the client-supplied `ownerName` blindly.

```json
// request
{ "number": "6037997599571347", "ownerName": "علی رضایی" }
// 200
{ "id": "card_1", "number": "6037997599571347", "ownerName": "علی رضایی", "primary": true, "status": "verified" }
```

Adding a number that's already saved for this user returns the existing
record (idempotent), not a duplicate.

Errors: `INVALID_CARD` (422 — bad length/checksum), `NOT_OWNER` (422 — «این
کارت به نام شما نیست. فقط حساب‌های به نام خودتان را می‌توانید اضافه کنید.»).

### PUT `/wallet/cards/{id}/primary` — auth

Make this card the primary one (auto-selected for deposit/withdraw). Demotes
any previously-primary card for this user.

Response: **204**. Errors: `CARD_NOT_FOUND` (404).

### DELETE `/wallet/cards/{id}` — auth

Forget a saved card. If it was primary and others remain, the backend
promotes one of the remaining cards to primary (a non-empty list always has
exactly one primary).

Response: **204**. Errors: `CARD_NOT_FOUND` (404).

## IBANs (شبا)

### GET `/wallet/ibans` — auth

```json
// 200
[
  {
    "id": "iban_1",
    "value": "IR820540102680020817909002",
    "ownerName": "علی رضایی",
    "primary": true,
    "status": "verified"
  }
]
```

### POST `/wallet/ibans` — auth

Same pattern as cards: the frontend mod-97-validates and has already
confirmed ownership via `/kyc/iban-inquiry`; re-validate both server-side.

```json
// request
{ "iban": "IR820540102680020817909002", "ownerName": "علی رضایی" }
// 200
{ "id": "iban_1", "value": "IR820540102680020817909002", "ownerName": "علی رضایی", "primary": true, "status": "verified" }
```

Errors: `INVALID_IBAN` (422 — bad length/checksum), `NOT_OWNER` (422 — «این
شبا به نام شما نیست. فقط حساب‌های به نام خودتان را می‌توانید اضافه کنید.»).

### PUT `/wallet/ibans/{id}/primary` — auth

Response: **204**. Errors: `IBAN_NOT_FOUND` (404).

### DELETE `/wallet/ibans/{id}` — auth

Response: **204**. Errors: `IBAN_NOT_FOUND` (404).

## Notes for backend

- There is **no update/edit endpoint** for either resource by design — the
  frontend only ever adds or removes; a changed number is a remove + add.
- `GET /wallet/cards` and `GET /wallet/ibans` (and the whole feature) are
  reachable in the UI only once `kycVerified` is true on the account
  profile (`GET` the profile via the `account` feature — see
  `doc/account/api.md`), but the backend should still enforce it: reject
  add/list/mutate with **403** for an unverified user rather than relying on
  the frontend gate alone.
- Mock reference for `NOT_OWNER`: `lib/infrastructure/kyc/mock-bank-inquiry.repository.ts`
  treats any card/IBAN whose digits end in `0000` as belonging to someone
  else — useful as a manual-test convention if the staging backend wants a
  similar deterministic trigger.
