# Auth — Implementation flow

Product context: [`PRD.md`](./PRD.md). Conventions: `CLAUDE.md`.

## Flow

```
/login  ── startLogin() ──▶ RequestOtpUseCase ──▶ MockAuthRepository
   │                          (challengeId, resendAfterSeconds)
   ▼
/login/verify?phone&cid&rs ── verifyLogin() ──▶ VerifyOtpUseCase ──▶ status
   │
   ├─ two-step password set?  ──▶ /login/two-step?st=<status>
   │        │ verifyTwoStepLogin() ─▶ TwoStepPasswordUseCase.verify
   │        │        └─ wrong ─▶ inline error
   │        └─ «فراموشی رمز» ─▶ /login/two-step/reset (identity + OTP + new pw)
   ▼
DESTINATION[status]:  registration→/kyc · approved→/market · declined→/declined
```

## File map

- Actions: `app/actions/auth.ts` (startLogin/resendOtp/verifyLogin/
  verifyTwoStepLogin, `DESTINATION`), state types in `auth-state.ts`.
- Use cases: `lib/core/application/auth/*`,
  `lib/core/application/account/use-cases/two-step-password.use-case.ts`.
- Domain: `lib/core/domain/auth/mobile.ts` (validation lives here),
  `lib/core/domain/account/two-step-password.ts` (the four rules, tested).
- UI: `components/auth/*` (`OtpInput` is reused by every SMS-code screen),
  pages under `app/login/**` (auth shell, outside the platform group).

## Notes

- Mock-only: phone/challenge/status travel in the URL. A real backend keeps
  the challenge and status in an httpOnly session — swap in the composition
  root + actions only.
- The two-step gate is skipped entirely when no password is set — the base
  login path is untouched.
