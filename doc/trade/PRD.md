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
  the referral program — see `doc/referral/PRD.md`).

## Flow

1. **Entry** — PDP CTAs or a coin row → `/trade/[symbol]?side=buy|sell`.
2. **Amount** — buy/sell toggle, coin header with unit price, Toman amount
   via Persian keypad, live «≈ coin» line, موجودی + «همه» chip.
3. **Confirm** — نوع سفارش / مقدار / قیمت واحد / مجموع.
4. **Receipt** — «خرید شما انجام شد» + links to کیف پول and بازار.

## Guards (server-side, Persian errors)

- Minimum order **۵۰۰٬۰۰۰ تومان**.
- Buy: total ≤ cash balance. Sell: coin amount ≤ held (with a clamp for the
  «فروش همه» floor-rounding artifact).
- KYC gate: deferred until auth sessions exist (documented blocker).

## Effects

A filled order settles against the shared mock wallet — the holding and the
history timeline update immediately (see `doc/portfolio` / `doc/history`).
