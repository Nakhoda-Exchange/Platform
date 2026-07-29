# Trade — Product Requirements (PRD)

## Summary

Market buy/sell in one screen (Moonshot-style): the user types a Toman
amount on a big keypad, sees the live coin equivalent, confirms a plain
summary, and gets a receipt. Guards are server-side and explain themselves
in plain Persian.

## Goals

- An elder can buy their first coin without asking a question: one amount,
  one confirm, one receipt.
- Totals always correct: conversion at the current price; server-side
  validation is the source of truth (client checks only mirror it).

## Non-goals (this tier)

- Limit/stop orders (structure allows a type later), order book, coin-unit
  entry mode (IRT-entry with live equivalent ships first), fees (arrive with
  the growth incentives — see `doc/incentives/api.md`).

## Flow

1. **Entry** — PDP CTAs or a coin row → `/trade/[symbol]?side=buy|sell`.
2. **Amount** — buy/sell toggle, coin header with unit price, Toman amount
   via Persian keypad, live «≈ coin» line, موجودی + «همه» chip.
3. **Confirm** — نوع سفارش / مقدار / قیمت واحد / مجموع.
4. **Receipt** — «خرید شما انجام شد» + links to کیف پول and بازار.

## Guards (server-side, Persian errors)

- Minimum order **۵۰۰٬۰۰۰ تومان** — **except a «فروش همه»**, which is exempt.
  The floor exists to refuse uneconomically small _new_ positions; applied to a
  full sell it merely freezes a holding whose value has fallen below it, since
  nobody buys more of a coin they are trying to exit. The screen says why
  («فروش کل دارایی از کمینه سفارش معاف است») rather than silently relaxing a rule
  it enforced a moment earlier.
- Buy: total ≤ cash balance. Sell: coin amount ≤ held (with a clamp for the
  «فروش همه» floor-rounding artifact). A full sell is sized by the **server**
  from the ledger, so it empties the position exactly rather than leaving dust
  behind at whatever the price drifted to since the page loaded.
- KYC gate: deferred until auth sessions exist (documented blocker).
- Every message the user sees is chosen from the error's `code`, never echoed
  from the wire — see «Error messages are decided client-side» in `api.md`.

## Submission is asynchronous to the user

Confirming hands the order off and shows the submission sheet immediately. A
MARKET order settles synchronously against a venue, so waiting for the response
meant pinning the user to a spinning button through a whole venue round-trip —
during which nothing they could do changed the outcome. The sheet is
dismissable; the receipt (or the failure) reaches them wherever they are.

## Effects

A filled order settles against the shared mock wallet — the holding and the
history timeline update immediately (see `doc/portfolio` / `doc/history`).
