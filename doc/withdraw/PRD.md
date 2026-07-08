# Withdraw (برداشت) — Product Requirements (PRD)

> **V0 scope:** crypto (coin) withdrawal is **removed / out of scope** for
> V0 — Toman to a saved IBAN (شبا) is the only withdrawal rail. See
> **Removed in V0** below.

## Summary

Take money out: **Toman to one of the user's own IBANs (شبا)**. Withdrawals
are reviewed — every request stays **pending**.

## Goals

- No surprises: کارمزد و «دریافتی خالص» shown before the CTA.
- Impossible to overdraw: amount is capped by balance/holdings server-side.
- The pending model is honest: «برداشت‌ها پس از بررسی انجام می‌شوند.»
- Recognizable destination: settlement is IBAN-only (Paya/Satna need a
  شبا, not a card), but the user still knows the شبا by the card they
  carry — show the matching bank's card as a subdued subhead, not another
  pickable field.

## Non-goals (this tier)

- OTP/2FA confirm step (needs auth sessions), fee tiers, address book.
- Crypto withdrawal — see **Removed in V0** below.

## Toman flow

Amount (min **۵۰۰٬۰۰۰ تومان**, max = cash balance, «همه» chip) + destination
**شبا** via IbanPicker — the user's saved IBANs (add via sheet, mod-97; same
saved instruments as `حساب‌های بانکی`, see [`doc/bank-account/`](../bank-account/)).
Each row shows the شبا; if one of the user's saved cards is issued by the
same bank (`sameBank`), it's shown as a subdued subhead under the شبا for
recognition — it is display-only, never selectable, never sent. Fee: رایگان,
stated. → pending receipt.

## Effects

Funds are reserved immediately (balance debited); the request shows as
«در انتظار» in تاریخچه.

## Removed in V0 — crypto withdrawal

Coin picker (holdings only) → destination address (plausibility check) →
amount in coin units (MAX chip) → کارمزد شبکه + دریافتی خالص from the fee
table → pending receipt. Guards: amount > network fee, amount ≤ held.

Deferred, not forgotten — this flow and its endpoints
(`GET /wallet/withdraw-fees`, `POST /wallet/withdrawals/crypto`,
[`api.md`](./api.md)) come back post-V0. The UI's coin-picker tab and
`crypto-withdraw-form.tsx` are being removed by the UI/infra agents in
parallel.
