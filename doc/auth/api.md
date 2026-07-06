# Auth — API contract

Port: `lib/core/application/auth/ports/auth-repository.port.ts` ·
Adapter: `lib/infrastructure/auth/http-auth.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## POST `/auth/otp/request`

Issue an OTP for a mobile number (already `09xxxxxxxxx`-validated client-side;
re-validate server-side).

```json
// request
{ "mobile": "09121234567" }
// 200
{ "challengeId": "chg_9f2…", "mobile": "09121234567", "resendAfterSeconds": 120 }
```

Errors: `INVALID_MOBILE` (422), `TOO_MANY_REQUESTS` (429, message says when to retry).

## POST `/auth/otp/verify`

```json
// request
{ "challengeId": "chg_9f2…", "code": "123456" }
// 200
{
  "userId": "u_1",
  "mobile": "09121234567",
  "token": "eyJ…",            // becomes the Bearer for every later call
  "status": "approved"         // registration | approved | declined
}
```

Errors: `INVALID_CODE` (422), `CHALLENGE_EXPIRED` (410).

## Notes for backend

- `status` drives routing: `registration` → KYC, `approved` → market,
  `declined` → dead-end page (no session must work for declined).
- The two-step password gate (see `doc/account/api.md`) runs AFTER verify for
  users who enabled it; the token above should be limited until the gate
  passes, or a second short-lived token model — backend's choice, but the
  frontend expects verify → (optional gate) → fully usable Bearer.
