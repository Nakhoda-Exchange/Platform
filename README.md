# ناخدا (Nakhoda)

A modern, **mobile-first, RTL Persian** platform for trading altcoins. This repo
is the web platform — the marketing **landing**, the authenticated **app**, and
(later) the blog. There is no backend yet, so all data access goes through
repository **ports** backed by in-memory **mock adapters**; swapping to a real
backend is a one-file change in the DI composition root.

It's also an installable **PWA** with a branded splash, and simple enough that a
first-time crypto buyer can finish a task without asking a question — our design
north-star is the radical simplicity of our rival, [Moonshot](https://moonshot.com/)
(see the `nakhoda-ux` design guide).

## Stack

- **Next.js 16** (App Router, Turbopack, React 19) — a breaking-change release, see `AGENTS.md`
- **Tailwind CSS v4** (CSS-first `@theme` tokens in `app/globals.css`)
- **TypeScript**, **Vazirmatn** font; the whole app is RTL (`<html dir="rtl">`)
- **jalaali-js** for Jalali (Persian) dates; **Goftino** for support chat
- Tests via **`bun test`**

## Getting started

```bash
bun install           # bun.lock is the lockfile (npm also works)
cp .env.example .env   # set NEXT_PUBLIC_GOFTINO_WIDGET_ID
bun run dev           # http://localhost:3000 (Turbopack)
```

> Next.js 16 allows only **one** dev server per project directory — a second `next dev` in the same folder exits.

## Scripts

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `bun run dev`       | Dev server (Turbopack)                         |
| `bun run build`     | Production build                               |
| `bun run start`     | Serve the production build                     |
| `bun run clean`     | Remove `.next` and kill a stale `:3000` server |
| `bun run lint`      | ESLint                                         |
| `bun run typecheck` | `tsc --noEmit`                                 |
| `bun test`          | Unit tests (colocated `*.test.ts`)             |
| `bun run format`    | Prettier write                                 |

## Features

- **Landing** — marketing page with the phone CTA.
- **Auth** — phone + OTP (mock code **`123456`** for any `09xxxxxxxxx`).
- **Login-status routing** — after OTP, the user's status picks the destination:
  `registration → /kyc`, `approved → /market`, `declined → /declined` (a dead-end
  retry page; the platform is never shown to a declined user).
- **KYC** — national code + Jalali birth date → identity inquiry → read-only
  confirm. Min sign-up age enforced. See `doc/kyc/`.
- **Platform shell** — sticky header + floating bottom nav wrapping the
  authenticated app (`/market`, `/wallet`, `/account`), via the `(platform)`
  route group.
- **Market** — coin list (PLP) with icon/name/symbol, 24h change (green/red), and
  IRT + USD prices; rows open the coin detail page.
- **Support chat** — Goftino, opened from the header icon (no default launcher).
- **PWA** — installable, opens on `/market`, branded splash.

## Architecture

**Clean architecture** with a small typed **DI** container. The dependency rule
points inward: domain ← application ← infrastructure; the presentation layer
(Next.js) reaches use cases through the container.

```
lib/
  core/
    domain/          entities, value objects (validation lives here), Result<T>
    application/     ports (repository interfaces) + use cases
  infrastructure/    adapters implementing ports (mock, in-memory for now)
  di/                typed container; container.instance.ts is the composition root
  utils/             cn(), digits, jalali, money helpers
app/                 routes + thin server actions (app/actions/)
  (platform)/        authenticated app under the shell (market/wallet/account)
components/          ui/ primitives, then layout/ auth/ landing/ market/ pwa/ support/
```

To move off mocks, swap the adapter registration in
`lib/di/container.instance.ts` — nothing else changes.

## Docs

- **`CLAUDE.md`** / **`AGENTS.md`** — guidance for contributors and AI assistants.
- **`DESIGN.md`** — design tokens, typography, RTL, a11y. **`COMPONENTS.md`** — component catalog.
- **`doc/<feature>/`** — per-feature PRD + implementation flow (e.g. `doc/kyc/`).
- **`CONTRIBUTORS.md`** — branch/commit conventions (every change on a branch → PR).
- The `nakhoda-ux` skill (`.claude/skills/`) — design + Persian UX-writing rules.

## Conventions

- **Mobile-first, RTL, must work on mobile Safari _and_ Chrome** — verify in WebKit and Chromium.
- **Blue-only palette** (brand + neutrals); non-blue only for a real state or gain/loss data.
- Design tokens live in `app/globals.css` under `@theme`; editing them needs a **dev-server restart**.
- Persian digits everywhere in UI; convert via `lib/utils/digits.ts`.
