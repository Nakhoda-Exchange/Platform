# KYC — Product Requirements (PRD)

## Summary

Iranian regulation requires exchanges to verify a user's legal identity before
they can trade. After phone login (OTP), the user completes a lightweight
**identity verification (احراز هویت)**: they enter their national code + birth
date, we run a government identity inquiry (Shahkar-style), and they confirm the
name the inquiry returns. On success they land on the market.

## Goals

- Verify the user is a real, registered person tied to their phone number.
- Keep it to the **fewest possible steps** — two screens, no document upload,
  no selfie (the identity inquiry covers it for this tier).
- Fully RTL Persian, mobile-first, same look as the auth flow.

## Non-goals (this tier)

- Document/passport upload, liveness/selfie, address proof. Out of scope until a
  higher verification tier is needed. Do not build speculatively.

## User story

> As a newly logged-in user, I enter my national code and birth date, confirm
> the identity the system finds for me, and reach the market — so I can trade.

## Flow (product view)

```
OTP verified ─▶ Identity input ─▶ inquiry ─▶ Confirm identity ─▶ Market
                     ▲                              │
                     └──────── back / edit ─────────┘
```

Figma: `nakhoda-kyc-identity`, `nakhoda-kyc-confirm` (mobile, 390×844).

## Screen 1 — Identity input

User provides the minimum needed to run the inquiry.

| Field         | Label (fa)        | Requirement                                     |
| ------------- | ----------------- | ----------------------------------------------- |
| National code | کد ملی            | required, **exactly 10 digits**, valid checksum |
| Birth date    | تاریخ تولد (شمسی) | required, **Jalali** `YYYY/MM/DD`               |
| Invite code   | کد دعوت (اختیاری) | **optional**, 6-char alphanumeric               |

- Primary CTA: **استعلام و ادامه**. Disabled until national code + birth date
  are valid. Invite code never blocks submission.
- All digits shown as Persian digits.

## Screen 2 — Confirm identity

The inquiry returns the person's registered identity; we show it **read-only**.

| Field         | Label (fa)   | Source                     |
| ------------- | ------------ | -------------------------- |
| First name    | نام          | inquiry result (read-only) |
| Last name     | نام خانوادگی | inquiry result (read-only) |
| Father's name | نام پدر      | inquiry result (read-only) |

- Primary CTA: **تأیید و ادامه** → Market.
- Secondary: **بازگشت و ویرایش اطلاعات** → back to Screen 1 to re-enter.

## States & edge cases

- **Invalid input** — inline error under the field (bad length/checksum, empty
  date). CTA stays disabled.
- **Inquiry pending** — CTA shows a loading state and is disabled (no double
  submit).
- **No match / not found** — the national code + birth date don't resolve to a
  person: inline error on Screen 1, user stays put and can correct.
- **Mismatch on confirm** — the returned name isn't the user: they tap back and
  re-enter (there is no editing of the read-only result).
- **Already verified** — a verified user skips KYC and goes straight to market.

## Copy (Persian)

- Title 1: «احراز هویت» — Sub: «برای فعال‌سازی حساب، کد ملی و تاریخ تولد خود را وارد کنید.»
- Title 2: «تأیید اطلاعات هویتی» — Sub: «اطلاعات زیر از سامانه استعلام دریافت شد. در صورت درستی، تأیید کنید.»
- Errors: «کد ملی نامعتبر است.» / «تاریخ تولد را وارد کنید.» / «اطلاعاتی با این مشخصات یافت نشد.»

## Success metric

Share of logged-in users who complete KYC and reach the market; drop-off per
screen. Error rate on the inquiry call.

## Design & implementation

- Visual system: `DESIGN.md` + `COMPONENTS.md`.
- Developer flow, architecture, API contract: [`flow.md`](./flow.md).
