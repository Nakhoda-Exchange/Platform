# Withdraw (برداشت) — Product Requirements (PRD)

## Summary

Take money out: **Toman to one of the user's own bank cards**, or **crypto
to an external address** with the network fee and net amount stated before
confirming. Withdrawals are reviewed — every request stays **pending**.

## Goals

- No surprises: کارمزد و «دریافتی خالص» shown before the CTA.
- Impossible to overdraw: amount is capped by balance/holdings server-side.
- The pending model is honest: «برداشت‌ها پس از بررسی انجام می‌شوند.»

## Non-goals (this tier)

- IBAN/Sheba targets (card-only), OTP/2FA confirm step (needs auth
  sessions), fee tiers, address book.

## Toman flow

Amount (min **۵۰۰٬۰۰۰ تومان**, max = cash balance, «همه» chip) + destination
card via the same CardPicker as deposit (add via sheet, Luhn). Fee: رایگان,
stated. → pending receipt.

## Crypto flow

Coin picker (holdings only) → destination address (plausibility check) →
amount in coin units (MAX chip) → کارمزد شبکه + دریافتی خالص from the fee
table → pending receipt. Guards: amount > network fee, amount ≤ held.

## Effects

Funds are reserved immediately (balance/holding debited); the request shows
as «در انتظار» in تاریخچه.
