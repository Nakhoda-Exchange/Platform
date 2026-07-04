# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Nakhoda (ناخدا) is a mobile-first, **RTL Persian** altcoin-trading platform. `<html dir="rtl">`, Vazirmatn font. It must work on **both mobile Safari and Chrome** — verify UI changes against WebKit and Chromium, not Chrome alone.

## Commands

```bash
bun install          # bun.lock is the lockfile (npm works too)
bun run dev          # dev server on :3000 (Turbopack)
bun run build        # production build (Turbopack)
bun run lint         # eslint
npx tsc --noEmit     # type-check
```

- Only **one** `next dev` is allowed per project directory (Next 16); a second one exits. If styles look broken after editing tokens, it's usually a stale dev server — restart it (see Tailwind note below).
- Unit tests run on **`bun test`** (colocated `*.test.ts`; e.g. the national-code checksum and Jalali date utils). Keep pure domain/util logic covered there. UI and flow behavior still needs **driving the running app in a browser** (WebKit + Chromium), especially the auth/OTP → KYC flow.

## Framework gotchas (Next.js 16 + Tailwind v4)

- This is a **breaking-change** Next.js release. Read the relevant guide in `node_modules/next/dist/docs/` before writing framework code.
- `params` and `searchParams` are **async** — `await` them (see `app/login/verify/page.tsx`).
- A `"use server"` file may only export **async functions**. Keep state constants/types in a sibling module (see `app/actions/auth.ts` + `app/actions/auth-state.ts`).
- Tailwind v4 is **CSS-first**: design tokens live in `app/globals.css` under `@theme` (e.g. `--color-brand`, `--color-ink`, `--radius-card`). **Editing `@theme` tokens requires a dev-server restart** — HMR does not pick them up, and the page renders unstyled until you restart.

## RTL notes

- In an RTL container, `items-start` aligns to the **right**. Force `dir="ltr"` on subtrees that must flow left-to-right — e.g. the OTP boxes (`components/auth/otp-input.tsx`) and the feature grid (`components/landing/feature-grid.tsx`, to match the Figma left-to-right card order while each card stays RTL).
- Persian ↔ Latin digit conversion, mobile validation, and masking live in `lib/utils/digits.ts`; use these rather than hand-rolling.

## Architecture

Clean architecture with a typed DI container. The dependency rule points inward: **domain ← application ← infrastructure**, and the presentation layer (Next.js routes/actions/components) reaches use cases through the container.

- `lib/core/domain/` — entities, value objects, and `shared/result.ts` (`Result<T>`, `ok`, `fail`). Validation is a domain concern (e.g. `Mobile.create` in `lib/core/domain/auth/mobile.ts`), so anything holding a value object is already valid.
- `lib/core/application/<feature>/` — `ports/` (repository interfaces) and `use-cases/` (interactors that depend only on ports).
- `lib/infrastructure/<feature>/` — adapters implementing ports. Currently `Mock*` with **in-memory state** (per-process; not production-shaped — expected until the backend lands).
- `lib/di/` — `token.ts` / `container.ts` (dependency-free, typed, no decorators), `tokens.ts` (the `TOKENS` registry), and **`container.instance.ts` — the composition root and the ONLY place that binds ports to adapters**. To move off mocks, swap the adapter registration there; nothing else changes.
- Presentation: server actions (`app/actions/`) resolve a use case with `container.resolve(TOKENS.X)`, call `.execute(...)`, then return an error state or `redirect()`. Actions stay thin.

**Adding a feature:** create its domain types → a port + use case(s) → a mock adapter → register the adapter and use cases in the composition root under new tokens.

## Components

- `components/ui/` — generic primitives. There is a **single `Button`** (`variant` / `size` / `shape` / `fullWidth`); to style a `Link` like a button, use the exported `buttonClasses()` recipe. Icons are inline SVGs in `components/ui/icons.tsx` (`stroke="currentColor"`; recolor with `text-*`).
- `components/{layout,landing,auth,market,support}/` — feature components that compose the primitives. Keep `"use client"` on interactive leaves only; pages and layout are server components. There is **one** `Logo` (`components/layout/logo.tsx`) used everywhere — do not fork it.

## Auth → status → KYC (concrete example of the layering)

Landing CTA (`components/landing/phone-cta-card.tsx`) or `/login` → `startLogin` action → `RequestOtpUseCase` → `MockAuthRepository` (opaque `crypto.randomUUID()` challenge) → redirect to `/login/verify?phone&cid&rs` → `verifyLogin`. The mock code is always **`123456`**.

`verifyOtp` returns a **login status** that decides the destination (`app/actions/auth.ts`):

- `registration` → `/kyc` (default for new numbers)
- `approved` → `/market` (mock: `09111111111`)
- `declined` → `/declined` (mock: `09000000000`) — an empty page with a centered retry-KYC button; a declined user never sees the platform.

**KYC** (`app/kyc`, `app/kyc/confirm`, docs in `doc/kyc/`): national code + Jalali birth date → `InquireIdentityUseCase` (enforces `MIN_SIGNUP_AGE`) → mock identity inquiry → read-only confirm → `/market`. The inquiry result is stashed **server-side** in `KycSessionStore` under an opaque id carried in an **httpOnly cookie** — never in the URL (that's the tamper-safe pattern; the OTP challenge is still URL-borne, mock-only).

## Platform shell, market, support

- **Shell** — the authenticated app lives under the `app/(platform)/` route group; `AppLayout` wraps it in `AppShell` (sticky `PlatformHeader` + floating `BottomNav`). Header content is per-route via `HEADER_CONFIG` (logo on main tabs, title/back on sub-pages); nav items are in `components/layout/platform-nav.ts`. Landing/auth are **outside** the group, so no shell there.
- **Market** (`/market`) — coin list (PLP): `MarketRepository` → `ListCoinsUseCase`; `MarketList`/`CoinListItem` show name/symbol, 24h change (green/red **plus** ▲/▼ + aria label — never color alone), IRT + USD. Money/percent formatting in `lib/utils/money.ts`. Rows link to `/market/[symbol]` (PDP). Search/filters are a separate feature.
- **Support chat** — Goftino (`components/support/`), opened from the header icon via `openSupportChat()`; the default launcher is hidden. Widget id from `NEXT_PUBLIC_GOFTINO_WIDGET_ID`.

## Environment

Public config only, read in the browser, so `NEXT_PUBLIC_`-prefixed. `.env` is gitignored; `.env.example` lists the keys.

- `NEXT_PUBLIC_GOFTINO_WIDGET_ID` — Goftino support-chat widget id.

## Design & UX

Blue-only palette (brand + neutrals); non-blue only for a real state or gain/loss data. One logo everywhere — the `Logo` component (`components/layout/logo.tsx`): «ناخدا» wordmark + anchor mark in a brand tile. Simplicity is the bar (north-star: our rival **Moonshot**, moonshot.com). Details in `DESIGN.md`, `COMPONENTS.md`, and the `nakhoda-ux` skill.
