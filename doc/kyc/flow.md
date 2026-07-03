# KYC — Implementation flow

What developers build and the correct order of operations. Product context and
copy: [`PRD.md`](./PRD.md). Visual system: `DESIGN.md`, `COMPONENTS.md`.

## Flow

```
/login/verify (OTP ok) ──▶ verifyOtp returns { session, status }
      │
      ├─ status = approved     ─▶ redirect /market
      ├─ status = declined     ─▶ redirect /declined  (empty page + centered retry-KYC button)
      └─ status = registration ─▶ redirect /kyc
                                     │
/kyc            Screen 1 — identity input (national code, birth date, invite?)
      │  submitKycIdentity()  ──▶ IdentityInquiryUseCase ──▶ port ──▶ Mock adapter
      │                                                             (returns name/father)
      ▼
/kyc/confirm    Screen 2 — confirm read-only result
      │  confirmKyc()  ──▶ MarkVerifiedUseCase
      ▼
/market
      ▲
      └── "back" from confirm returns to /kyc with values preserved
```

## Auth-repository change (login status)

`verifyOtp` must now report **where the user stands**, not just a session.

- Add a `LoginStatus = 'registration' | 'approved' | 'declined'` type
  (`lib/core/domain/auth/`), and extend `AuthSession` (or the verify result)
  with a `status: LoginStatus` field.
- `AuthRepository.verifyOtp` returns the status; `VerifyOtpUseCase` passes it
  through. The `MockAuthRepository` decides the status from the mobile so the
  flow is testable without a backend, e.g.:
  - a reserved "declined" test number → `declined`
  - a reserved "approved" test number → `approved`
  - everything else (new user) → `registration`
- `verifyLogin` action branches on `status`:
  `registration → redirect('/kyc')`, `approved → redirect('/market')`,
  `declined → redirect('/declined')`. It no longer hard-codes `redirect('/')`.
- `/declined` is a standalone page — **no site chrome**: centered column, short
  message, one primary button «تلاش مجدد احراز هویت» linking to `/kyc`. A
  declined user must never reach the platform, so don't render market/nav here.

## Layering (mirror the auth feature)

Follow the clean-architecture rule (`CLAUDE.md`): domain ← application ←
infrastructure; presentation resolves use cases from the DI container.

1. **Domain** `lib/core/domain/kyc/`
   - `NationalCode.create(raw): Result<NationalCode>` — normalize digits, require
     10 digits, **validate the Iranian national-code checksum**. Validation is a
     domain concern; holding the value object means it's valid.
   - `JalaliDate.create(raw): Result<JalaliDate>` — parse `YYYY/MM/DD` Jalali,
     range-check. Reuse in a shared util if one already exists.
   - `Identity` entity — `firstName`, `lastName`, `fatherName`.
2. **Application** `lib/core/application/kyc/`
   - `ports/identity-inquiry.port.ts` — `inquire(nationalCode, birthDate): Promise<Result<Identity>>`.
   - `use-cases/inquire-identity.use-case.ts`, `confirm-kyc.use-case.ts`.
3. **Infrastructure** `lib/infrastructure/kyc/`
   - `MockIdentityInquiry` — in-memory, returns a canned `Identity` (and a
     "not found" branch for a reserved test national code) until the real
     inquiry backend lands. Same pattern as `MockAuthRepository`.
4. **DI** — register port→adapter and the use cases in `container.instance.ts`
   under new `TOKENS`. That composition root is the only place bindings live.
5. **Presentation**
   - Routes: `app/kyc/page.tsx` (input), `app/kyc/confirm/page.tsx` (confirm),
     `app/declined/page.tsx` (declined dead-end), and a `/market` destination
     for approved users.
   - Server actions `app/actions/kyc.ts` (`"use server"`, async only; keep
     constants/types in a sibling `kyc-state.ts`). Actions stay thin: resolve
     the use case, `.execute()`, return an error state or `redirect()`.

## API contract (client ⇄ inquiry)

```
request : { nationalCode: string(10), birthDate: string(jalali), inviteCode?: string(6) }
response: { matched: boolean, identity?: { firstName, lastName, fatherName } }
```

`inviteCode` is only sent when non-empty.

## UI

- Reuse `AuthShell`/logo, `Field`, `Button` (`xl`, `fullWidth`). No new
  primitives — KYC is new _forms_, not new components (`COMPONENTS.md`).
- Screen 1 fields: `Field` for national code (`inputMode="numeric"`) and invite
  code; a **Jalali date picker** for birth date — do NOT use
  `<input type="date">` (Gregorian). Add a picker only if none exists.
- Screen 2 fields: `Field` with `readOnly` — `surface` fill, `ink` value text,
  no focus ring, no caret. Still labelled.
- Progress: 2-segment bar (step 1 = first segment brand; step 2 = both brand).

## Things to consider

- **RTL**: right-align labels/values; keep numeric entry LTR where needed
  (`dir="ltr"` on the national-code/date inputs so digits flow correctly).
- **Digits**: convert Persian↔Latin with `lib/utils/digits.ts` on input and
  display — never store Persian digits; never hand-roll conversion.
- **Checksum + Jalali** live in the domain/`lib/utils`, reused — not inlined per
  screen. One runnable check (assert-based) on the checksum + a couple of
  known-valid/invalid codes.
- **No double submit**: disable the CTA + show pending during the inquiry.
- **Guarding**: unverified users are redirected into `/kyc`; verified users are
  redirected out of it. Decide where the "verified" flag lives (session/user).
- **Mock now**: state is in-memory/per-process (expected until the backend
  lands). Swapping to the real inquiry = change the adapter registration only.
- **Verify on WebKit + Chromium** — especially the Jalali picker and RTL inputs.
