# Portfolio (کیف پول) — Product Requirements (PRD)

## Summary

The wallet home: total account value, today's P&L, a trend chart, quick
actions (واریز / برداشت / خرید‌وفروش / تاریخچه), and the holdings list with
IRT equivalents.

## Goals

- One glance answers «چقدر دارم؟ امروز چطور بود؟».
- Total value = **sum of holdings** (single source of truth).
- Change data pairs color with ▲/▼ + words; Persian digits everywhere.

## Non-goals (this tier)

- Real time-series balance chart (static trend placeholder), per-holding
  P&L breakdowns, CSV export.

## Screen

- **Summary** — «موجودی کل» (Toman), «امروز» pill (24h P&L derived from each
  coin's change), trend chart, 2×2 quick-action grid.
- **Holdings** — rows: logo, name, amount held (`۰٫۰۰۱۵ BTC`), Toman value,
  24h change. Tapping opens the coin's PDP.
- **Empty state** — «هنوز دارایی‌ای نداری» + خرید رمزارز / واریز تومان CTAs.

## Live behaviour

Trades, deposits and withdrawals all settle against the same shared mock
wallet, so this screen reflects them immediately.
