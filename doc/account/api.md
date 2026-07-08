# Account — API contract

Port: `lib/core/application/account/ports/user-repository.port.ts` ·
Adapter: `lib/infrastructure/account/http-user.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## GET `/account/profile` — auth

```json
// 200 — UserProfile
{
  "name": "علی رضایی", // from the KYC identity
  "mobile": "09121234567",
  "kycVerified": true,
  "twoFactorEnabled": false // true ⇔ a two-step password exists
}
```

## PUT `/account/two-step-password` — auth

Set/replace the two-step password. Frontend enforces ≥8 chars + upper +
lower + digit and re-checks server-side today — the backend must own this
validation too.

```json
// request
{ "password": "Nakhoda1" }
// 200 — the updated UserProfile (twoFactorEnabled: true)
```

Errors: `WEAK_PASSWORD`, `PASSWORD_MISMATCH` (if a confirm field is added) — 422.

## POST `/account/two-step-password/verify` — auth (limited token)

The login gate. Called after OTP for users with 2FA enabled.

```json
// request
{ "password": "Nakhoda1" }
// 204 — gate passed (upgrade the session per doc/auth/api.md notes)
```

Errors: `WRONG_PASSWORD` (422, «رمز دومرحله‌ای درست نیست.»), rate-limit hard.

## Notes for backend

- **Reset** (identity + SMS): the frontend flow posts national code + Jalali
  birth date + OTP + the new password. Add
  `POST /account/two-step-password/reset` accepting
  `{ nationalCode, birthDate, code, password }` with the KYC error codes
  (`INVALID_NATIONAL_CODE`, `INVALID_BIRTHDATE`, `INVALID_CODE`) — the UI
  jumps back to the step named by the code.
