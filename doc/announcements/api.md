# Announcements — API contract

Port: `lib/core/application/account/ports/announcements-repository.port.ts` ·
Adapter: `lib/infrastructure/account/http-announcements.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## GET `/announcements` — auth

```json
// 200 — array of Announcement
[
  {
    "id": "card-deposit",
    "title": "واریز کارت‌به‌کارت راه‌اندازی شد",
    "body": "از امروز می‌توانید…\n\n۱. از صفحه…", // Persian MARKDOWN (or HTML)
    "at": "2026-07-05T10:00:00Z",
    "image": "https://cdn…/banner.png", // optional
    "action": {
      // optional — see contract
      "type": "internal",
      "label": "واریز تومان",
      "href": "/wallet/deposit"
    }
  }
]
```

## The action contract (discriminated union)

| `type`     | payload         | client behaviour                             |
| ---------- | --------------- | -------------------------------------------- |
| `internal` | `label`, `href` | in-app navigation                            |
| `external` | `label`, `url`  | new tab (`noopener`) — Telegram, Instagram…  |
| _(new)_    | —               | **ignored by older clients** — extend freely |

## Notes for backend

- `body` is first-party markdown rendered server-side by the frontend; if
  third-party content ever enters this pipe, flag it so sanitization is added.
- Unread state is device-local today (IndexedDB). When read-receipts move
  server-side, add `POST /announcements/read` (204) — the frontend already
  isolates the call site (`markAllRead`).
