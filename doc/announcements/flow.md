# Announcements — Implementation flow

Product context: [`PRD.md`](./PRD.md).

## Flow

```
header (every platform screen)
   NotificationBell (client) ── fetchAnnouncements() ─▶ DTOs (Dates→ISO)
      │  syncAnnouncements(): merge into IndexedDB (new rows arrive unread,
      │  existing rows KEEP their readAt) ─▶ unreadCount() ─▶ badge (۹۹ cap)
      ▼  tap ─▶ /account/announcements
/account/announcements (server list, newest first, Jalali dates)
      │  <MarkAnnouncementsRead/> (client): sync → markAllRead()
      │      └─ dispatches ANNOUNCEMENTS_EVENT ─▶ bell recounts → badge clears
      ▼
/account/announcements/[id] (server detail)
      ├─ image? ─ banner
      ├─ body: marked.parse(markdown) — server-rendered, first-party trusted
      └─ action? ─ AnnouncementActionButton resolves the CONTRACT:
            internal → <Link href>   ·   external → <a target="_blank">
            unknown type → renders nothing (forward compatible)
```

## File map

- Contract + domain: `lib/core/domain/account/announcement.ts`
  (`AnnouncementAction` union — THE backend⇄frontend contract — and
  `Announcement` with `image?`/`action?`; body is markdown).
- Port/use case/mock: `announcements-repository.port.ts`,
  `list-announcements.use-case.ts` (sorted + byId),
  `mock-announcements.repository.ts` (seeded with md bodies, an image and
  internal + external actions).
- Client cache: `lib/utils/announcements-db.ts` — native IndexedDB
  (`nakhoda` db, `announcements` store): `syncAnnouncements` /
  `unreadCount` / `markAllRead` + `ANNOUNCEMENTS_EVENT`.
- Server boundary: `fetchAnnouncements()` in `app/actions/account.ts`
  returns serializable DTOs.
- UI: `components/layout/notification-bell.tsx` (badge),
  `components/account/mark-announcements-read.tsx`,
  `components/account/announcement-action.tsx` (contract resolver),
  pages under `app/(platform)/account/announcements/**`.

## Notes

- The bell fails silent (offline/IndexedDB unavailable → no badge, never an
  error) — announcements are never in the critical path.
- Read-state migration: when auth sessions land, `markAllRead` should also
  notify the backend; the IndexedDB cache stays as the offline copy.
- Adding an action type = extend the union + one `case` in the resolver;
  older clients ignore it by design.
