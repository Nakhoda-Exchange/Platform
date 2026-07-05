# Account (حساب کاربری) — Product Requirements (PRD)

## Summary

The user's hub: who they are (name, phone, KYC state), their security
(two-step password), platform news (اعلان‌ها), display mode, support, legal,
logout and the app version — one calm list, one action per row.

## Goals

- Everything about «من» in one place; every row says where it leads.
- KYC state is glanceable: «هویت تأیید شده» chip or a CTA into `/kyc`.
- Settings rows follow one recipe (icon + label + value + chevron).

## Non-goals (this tier)

- Editing profile fields (name comes from KYC), avatar upload, device/session
  management, notification preferences (the اعلان‌ها row lists platform
  announcements, not push settings).

## Rows

| Row                 | Destination / behaviour                     |
| ------------------- | ------------------------------------------- |
| ورود دومرحله‌ای     | `/account/two-step` — see `doc/auth/PRD.md` |
| حالت نمایش          | inline سیستم/روشن/تیره picker — `doc/theme` |
| اعلان‌ها            | `/account/announcements` (list → detail)    |
| پشتیبانی            | opens the Goftino widget                    |
| قوانین و حریم خصوصی | `/account/terms` (static, draft legal copy) |

Footer: «خروج از حساب» (pinned) then «نسخه x.y.z» from `package.json`.

## Announcements

Newest first with Jalali dates; each opens a detail page. Content is
platform news (launches, listings, maintenance) in plain Persian.

## Logout

Clears what session state exists (the pending-KYC cookie — no persisted
auth session yet) and returns to the landing page.
