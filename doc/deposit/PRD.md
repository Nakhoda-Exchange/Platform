# Deposit (واریز) — Product Requirements (PRD)

## Summary

Add funds two ways: **Toman via card-to-card** (the user transfers from
their own bank card to the company card and the backend confirms it) or
**crypto** to a per-coin deposit address with a QR.

## Goals

- The card-to-card ritual feels guided, not scary: pick your card → get OUR
  card → transfer → we confirm automatically.
- The company card is **fetched per deposit** (returned by the backend after
  the user picks their source card) — never hardcoded client-side.
- Crypto addresses are copyable and QR-scannable, with a wrong-network
  warning.

## Non-goals (this tier)

- PSP/gateway redirect (card-to-card is the launch rail), fiat vouchers,
  address rotation, deposit limits/tiers.

## Toman flow (three steps)

1. **Amount + source card** — min **۱۰۰٬۰۰۰ تومان**, quick chips; saved
   cards as a radio list; with none saved, a bottom sheet adds one
   (**16 digits + Luhn**, own-name cards only per the terms).
2. **Transfer** — the fetched company card («به نام شرکت ناخدا») with copy,
   the amount to send, and a **countdown** («۱۰:۰۰») while we poll for the
   backend's deposit-submitted event. The pending deposit is already
   visible in تاریخچه.
3. **Receipt** — the event flips the transaction to done and credits the
   balance («واریز شما تأیید شد»). Mock: the event fires ~15s in.

## Crypto flow

Coin picker chips → address + network label + server-rendered QR + copy.
Warning: «فقط {SYMBOL} را از طریق شبکه بالا به این آدرس بفرستید…».
