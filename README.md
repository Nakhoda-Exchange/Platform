# ناخدا (Nakhoda)

A modern platform for trading altcoins, built mobile-first for a Persian (RTL) audience. This repository is the web platform and is intended to house the marketing **landing**, the **platform** app, and the **blog**. Today it ships the landing page and the phone/OTP authentication flow; there is no backend yet, so all data access goes through repository **ports** backed by in-memory **mock adapters**.

## Stack

- **Next.js 16** (App Router, Turbopack, React 19) — note: this is a breaking-change release, see `AGENTS.md`
- **Tailwind CSS v4** (CSS-first `@theme` tokens in `app/globals.css`)
- **TypeScript**
- **Vazirmatn** font via `next/font/google`; the whole app is RTL (`<html dir="rtl">`)

## Getting started

```bash
bun install        # bun.lock is the lockfile (npm also works)
bun run dev        # http://localhost:3000 (Turbopack)
```

> Next.js 16 allows only **one** dev server per project directory — a second `next dev` in the same folder will exit.

## Scripts

| Command            | Description                      |
| ------------------ | -------------------------------- |
| `bun run dev`      | Start the dev server (Turbopack) |
| `bun run build`    | Production build                 |
| `bun run start`    | Serve the production build       |
| `bun run lint`     | Run ESLint                       |
| `npx tsc --noEmit` | Type-check                       |

## Architecture

The app follows **clean architecture** with a small **dependency-injection** container. The dependency rule points inward: domain ← application ← infrastructure, and the presentation layer (Next.js) talks to use cases through the DI container.

```
lib/
  core/
    domain/          entities, value objects (validation lives here), Result<T>
    application/     ports (repository interfaces) + use cases
  infrastructure/    adapters implementing ports (mock, in-memory for now)
  di/                typed container; container.instance.ts is the composition root
  utils/             cn(), Persian-digit helpers
app/                 routes + thin server actions (app/actions/)
components/          ui/ primitives, then layout/ landing/ auth/ feature folders
```

To move off mocks, swap the adapter registration in `lib/di/container.instance.ts` — nothing else changes.

## Auth flow

Landing CTA or `/login` → request OTP → `/login/verify` → verify → home. The mock OTP code is always **`123456`** for any valid Iranian mobile (`09xxxxxxxxx`).

## Conventions

- **Mobile-first, RTL, and must work on both mobile Safari and Chrome.** Verify UI changes in WebKit and Chromium.
- Design tokens live in `app/globals.css` under `@theme`; editing them requires a **dev server restart**.
- More detail for contributors (and AI assistants) lives in `CLAUDE.md` and `AGENTS.md`.
