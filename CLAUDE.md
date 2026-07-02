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
- There is **no test suite**. Verify behavior by driving the running app in a browser (WebKit + Chromium), especially for the auth/OTP flow.

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
- `components/{layout,landing,auth}/` — feature components that compose the primitives. Keep `"use client"` on interactive leaves only; pages and layout are server components.

## Auth flow (concrete example of the layering)

Landing CTA (`components/landing/phone-cta-card.tsx`) or `/login` → `startLogin` action → `RequestOtpUseCase` → `MockAuthRepository` (opaque `crypto.randomUUID()` challenge) → redirect to `/login/verify?phone&cid&rs` → `verifyLogin` → home. The mock code is always **`123456`**. The challenge currently travels in the URL (mock only; a real backend should use an httpOnly cookie).
