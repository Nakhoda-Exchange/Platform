# Announcements (اعلان‌ها) — Product Requirements (PRD)

## Summary

Platform news pushed from the backend, surfaced two ways: a **bell in the
platform header with an unread badge**, and the list under حساب کاربری.
Announcements are rich — markdown/HTML bodies, an optional image, and an
optional **action** (a typed backend→frontend contract) that can lead
anywhere: an in-app page or an external destination like Telegram or
Instagram.

## Goals

- The unread badge tells the user something new exists — from anywhere in
  the app — and clears the moment they visit the list.
- Rich content without app releases: the backend authors markdown, images
  and actions; the client just renders.
- **Offline-friendly and cheap**: every fetched announcement is cached
  on-device (IndexedDB); read-state is local until auth sessions exist.

## Non-goals (this tier)

- Push notifications (needs the PWA/notification permission story),
  per-user targeting, read receipts on the backend, in-list unread dots
  (the badge covers the need; add if requested).

## Unread model

- Every fetched announcement lands in the device cache **unread**.
- The badge = count of cached rows without a `readAt` stamp (capped ۹۹).
- **Visiting the list marks everything read** — one visit, badge cleared.
  Read-state is per-device by design (no sessions yet); it migrates to the
  backend when auth lands.

## The action contract (backend ⇄ frontend)

Actions are a **discriminated union** — the backend picks a `type`, the
client resolves the behaviour. Unknown types render **no action** (never a
broken one), so the backend can add types without breaking older clients.

| `type`     | Payload         | Client behaviour                      |
| ---------- | --------------- | ------------------------------------- |
| `internal` | `label`, `href` | In-app navigation (`next/link`)       |
| `external` | `label`, `url`  | New tab, `rel="noopener noreferrer"`  |
| _(future)_ | —               | Ignored by clients that don't know it |

Examples: «واریز تومان» → `/wallet/deposit` (internal), «عضویت در تلگرام
ناخدا» → `https://t.me/…` (external).

## Content

- **Body**: markdown (bold, lists, links…) or plain HTML — first-party
  content authored by the platform, rendered server-side. If third-party
  input ever enters this pipe, add sanitization at the render seam.
- **Image**: optional banner shown above the title on the detail page.
- **Dates**: Jalali («۱۳ تیر ۱۴۰۵») in the list and detail.
