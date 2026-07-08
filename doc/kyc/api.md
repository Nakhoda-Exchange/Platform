# KYC — API contract

Identity inquiry — Port: `lib/core/application/kyc/ports/identity-inquiry.port.ts` ·
Adapter: `lib/infrastructure/kyc/http-identity-inquiry.repository.ts`

Ownership (bank) inquiry — Port: `lib/core/application/kyc/ports/bank-inquiry.port.ts` ·
Adapter: `lib/infrastructure/kyc/http-bank-inquiry.repository.ts` · consumed by
[`doc/bank-account/`](../bank-account/) when adding a card/IBAN

Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## POST `/kyc/identity-inquiry` — auth

Resolve the registered identity (Shahkar-style) for the logged-in user's
national code + Jalali birth date. Enforce the minimum signup age server-side.

```json
// request
{ "nationalCode": "0499370899", "birthDate": "1375/06/15" }
// 200
{ "firstName": "علی", "lastName": "رضایی", "fatherName": "محمد" }
```

Errors: `INVALID_NATIONAL_CODE` (422), `INVALID_BIRTHDATE` (422),
`UNDERAGE` (422, message states the minimum age), `IDENTITY_NOT_FOUND` (404),
`IDENTITY_MISMATCH` (422 — code+date don't match the mobile's owner).

## POST `/kyc/card-inquiry` — auth

Ownership inquiry against Shaparak for a bank card the user is trying to add
(see [`doc/bank-account/`](../bank-account/)). Confirms the card's registered
holder matches the signed-in, KYC-verified user; the frontend only persists
the card via `POST /wallet/cards` once this returns 200.

```json
// request
{ "number": "6037997599571347" }
// 200
{ "ownerName": "علی رضایی" }
```

Errors: `INVALID_CARD` (422 — bad length/checksum), `NOT_OWNER` (422 — the
card is registered to someone other than the signed-in user; message: «این
کارت به نام شما نیست. فقط حساب‌های به نام خودتان را می‌توانید اضافه کنید.»).

## POST `/kyc/iban-inquiry` — auth

Ownership inquiry against the Sheba service for an IBAN (شبا) the user is
trying to add. Same contract shape as the card inquiry.

```json
// request
{ "iban": "IR820540102680020817909002" }
// 200
{ "ownerName": "علی رضایی" }
```

Errors: `INVALID_IBAN` (422 — bad length/checksum), `NOT_OWNER` (422 — «این
شبا به نام شما نیست. فقط حساب‌های به نام خودتان را می‌توانید اضافه کنید.»).

## Notes for backend

- The confirm step is frontend-side today (the inquiry result is held in an
  httpOnly-cookie-addressed store between the two screens). When the backend
  owns KYC state, add `POST /kyc/confirm` (auth, 204) marking the user
  verified — the account profile's `kycVerified` must then flip.
- Mock reference for `NOT_OWNER`: `lib/infrastructure/kyc/mock-bank-inquiry.repository.ts`
  treats any card/IBAN whose digits end in `0000` as belonging to someone
  else (`زهرا محمدی` vs. the mock KYC holder `علی رضایی`) — the documented
  trigger for testing the ownership-rejection path without a real backend.
