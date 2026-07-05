# History (تاریخچه) — Product Requirements (PRD)

## Summary

One unified timeline of everything that moved money: deposits, withdrawals,
buys and sells — grouped by day in Jalali, filterable by type, each row
showing what happened, when, its status, and the signed amounts.

## Goals

- «دیروز چی شد؟» answers itself: امروز / دیروز / Jalali-date groups.
- Status in words, never color alone: انجام شد (muted) / در انتظار (brand) /
  ناموفق (loss red).
- Received amounts are `+` green, spent are `−` red — sign + words always
  accompany the color.

## Non-goals (this tier)

- Asset/status filter chips (type filter covers the AC; same pattern
  extends), per-item detail view, export.

## Screen

- **Filters** — chips as plain links: همه / خرید / فروش / واریز / برداشت
  (`?type=`), so the page stays a server component and URLs are shareable.
- **Rows** — trades show the coin logo + «خرید بیت‌کوین»; Toman moves show a
  brand arrow badge + «واریز تومان»/«برداشت تومان». Time in Persian digits.
- **Empty states** — none at all vs. none for the active filter (with
  «نمایش همه تراکنش‌ها»).

## Live behaviour

Trades placed on the trade screen, card-to-card deposits (pending → done)
and withdrawal requests all append to this timeline immediately.
