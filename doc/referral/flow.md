# Referral program — Implementation flow

What developers build and the correct order of operations. Product context,
economics, and copy: [`PRD.md`](./PRD.md). Visual system: `DESIGN.md`,
`COMPONENTS.md`.

## Flow

```
Referrer on /account/referral
      │  «ارسال کد دعوت» (navigator.share) / «کپی کد» (clipboard)
      ▼
Friend opens /login?ref=CODE
      │  ref stored in an httpOnly cookie
      │  (same pattern as KYC_PENDING_COOKIE in app/actions/kyc-state.ts —
      │   opaque, server-side, never trusted from the URL after this point)
      ▼
Signup (OTP) ──▶ KYC ──▶ KYC confirm
      │                      │ attribution finalized here (both sides KYC'd,
      │                      │ self-referral check passes) — cookie cleared
      ▼                      ▼
Invitee trades ──▶ 0.35% fee accrues (discounted ~0.245% in first 90d)
      │
      ├─▶ referrer's share credited to wallet balance
      │      └─ logged in the history timeline as a `reward`
      │         transaction («پاداش دعوت»)
      └─▶ referrer tier recalculated (active-invitee count)
```

## Build order

Follow the clean-architecture rule (`CLAUDE.md`): domain ← application ←
infrastructure; presentation resolves use cases from the DI container; the
composition root `lib/di/container.instance.ts` is the only place bindings
live.

1. **Fees in the trade domain** — the prerequisite; ship first.
   - `FEE_RATE` constant in `lib/core/domain/trade/order.ts`; fee computed and
     deducted in `PlaceOrderUseCase`.
   - «کارمزد» line on the trade confirm screen and on the receipt — the fee is
     never silent.
   - Unit tests (`bun test`, colocated `*.test.ts`) for the fee math,
     including the discounted rate.
2. **Referral feature slice** (mirror the auth/KYC layering):
   - Domain `lib/core/domain/referral/` — code value object, tier rules,
     reward accrual.
   - Application `lib/core/application/referral/` — `ReferralRepository` port
     (`getOverview()` for the page: code, earnings, active-friend count, tier;
     `applyCode()` for attribution) + use cases.
   - Infrastructure — `MockReferralRepository`, in-memory, same pattern as
     `MockAuthRepository`.
   - DI — register adapter + use cases in `container.instance.ts` under new
     `TOKENS`.
3. **Wallet history** — add a `reward` member to `TransactionType` in
   `lib/core/domain/wallet/transaction.ts`; label («پاداش دعوت») + icon in
   `components/wallet/transaction-list-item.tsx`. Rewards then show up in the
   existing timeline for free.
4. **Presentation**
   - `/account/referral` page under `app/(platform)/` (gets the shell; add a
     `HEADER_CONFIG` title entry) + a «دعوت از دوستان» row in the account
     menu.
   - Share/copy: `navigator.share` with clipboard fallback («کپی کد»).
   - `?ref=` capture in the login route → httpOnly cookie via a thin server
     action (`"use server"`, async only; constants in a sibling state module,
     as in `app/actions/kyc.ts` + `kyc-state.ts`).
5. **Verify end-to-end in the browser** — Chromium + Firefox + WebKit: share
   sheet/clipboard, `?ref=` capture, full loop from invite link to a `reward`
   row in the timeline.

## Blocked on sessions

Real attribution and payouts need **persisted auth sessions** — the known
blocker from issues #3/#12. Until then, attribution state is in-memory in the
mock adapter (per-process, resets on restart — expected). The mocks
demonstrate the **full loop** (share → signup → KYC → trade → reward in
timeline → tier change); swapping to the real backend is an adapter
registration change in `container.instance.ts` only.

## Things to consider

- **Never trust the URL for attribution** — `?ref=` is read once and moved
  into the httpOnly cookie; finalization happens server-side at KYC confirm.
- **Digits**: earnings and counts display as Persian digits via
  `lib/utils/digits.ts`; amounts formatted with `lib/utils/money.ts`. Never
  hand-roll conversion.
- **RTL**: the code itself is Latin alphanumeric — render it `dir="ltr"`
  inside the RTL page (same trick as the OTP boxes).
- **Anti-abuse hooks** (PRD): self-referral check at KYC confirm (national
  code + bank card), payout floor, clawback — the domain layer owns these
  rules so the mock and the real adapter share them.
- **No double credit**: reward accrual must be idempotent per trade.
