# KYC — API contract

Port: `lib/core/application/kyc/ports/identity-inquiry.port.ts` ·
Adapter: `lib/infrastructure/kyc/http-identity-inquiry.repository.ts` ·
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

## Notes for backend

- The confirm step is frontend-side today (the inquiry result is held in an
  httpOnly-cookie-addressed store between the two screens). When the backend
  owns KYC state, add `POST /kyc/confirm` (auth, 204) marking the user
  verified — the account profile's `kycVerified` must then flip.
