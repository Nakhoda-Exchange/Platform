# COMPONENTS.md — component catalog

Primitives in `components/ui/`, feature components in
`components/{layout,landing,auth}/`. Tokens and rules: `DESIGN.md`.

Keep `"use client"` on interactive leaves only; pages and layout stay server
components. Compose primitives — don't re-style them ad hoc.

## Primitives (`components/ui/`)

### Button — `button.tsx`

The **single** button. Props: `variant` (`primary` | `ghost`), `size`
(`sm` | `md` | `lg` | `xl`), `shape` (`pill` | `rounded`), `fullWidth`.

- `primary`: `brand` fill, white text; disabled → `slate-200`/`slate-400`.
- `ghost`: transparent, `ink` text, `surface` hover.
- Sizes map to heights 36/44/48/56px. Mobile CTAs use `xl` + `fullWidth`.
- To style a `Link`/element as a button, call `buttonClasses(opts)` — never
  duplicate the recipe.

### Field — `field.tsx`

Labelled text input. 12px radius, `surface` fill, `line` border, `brand` focus,
inline red error. Wires `htmlFor`/`id` and `aria-invalid`. Props extend native
`input` + `label`, `error`, `containerClassName`.

- **Read-only variant** (KYC confirm): pass `readOnly`, keep `surface` fill,
  drop the focus ring and use muted text. Still label it.

### Card — `card.tsx`

Surface container: 20px radius, hairline `line` border, white fill. `as` +
`dir` overridable.

### IconBadge — `icon-badge.tsx`

48px `brand-soft` rounded square (12px radius) holding a `brand` icon.

### PageHeader — `page-header.tsx`

`title` (28→36px extrabold `ink`) + optional `description` (16px `muted`).

### Icons — `icons.tsx`

Inline SVG, `stroke="currentColor"`, 2px, round caps/joins, `aria-hidden`.
Recolor via `text-*`. Add new icons here following the `Icon` wrapper.
Current: Anchor, Smartphone, ZapOff, Coins, Edit, Rocket, ChevronRight,
ChevronLeft, User, Wallet, TrendingUp, Headphones. (No ShipWheel — the logo is
the anchor now.)

### Container / Section — `container.tsx`, `section.tsx`

Page width + vertical rhythm wrappers (1200px content cap).

## Auth (`components/auth/`)

`AuthShell` (centered 420px column), `AuthHeader` (uses `Logo`), `PhoneLoginForm`,
`OtpInput` (LTR 6-box), `OtpVerifyForm`, `ResendTimer`.

**KYC reuses these:** same `AuthShell`/`Logo`/header, `Field` for inputs,
`Button` `xl` for the CTA. New screens = new forms, not new primitives.

## Layout (`components/layout/`)

- **`Logo`** — the single Nakhoda logo (wordmark + anchor tile) used everywhere.
- **Platform shell** — `AppShell` (sticky header + content + floating nav),
  `PlatformHeader` (per-route logo/title/back + support action, client),
  `BottomNav` (route-aware active tab, client). Config in `platform-nav.ts`
  (`NAV_ITEMS`, `HEADER_CONFIG`).
- **Landing chrome** — `SiteShell`, `SiteHeader`, `SiteFooter`.

## Landing (`components/landing/`)

`Hero`, `PhoneCtaCard`, `Waves`, `FeatureCard`, `FeatureGrid` (LTR grid).

## Market (`components/market/`)

`MarketList` + `CoinListItem` (row → `/market/[symbol]`), `CoinBadge` (brand
letter badge), `ChangePill` (green/red + ▲/▼ + aria label). Formatting in
`lib/utils/money.ts`.

## PWA (`components/pwa/`)

`SplashScreen` (SSR overlay), `SplashHider` (fades it once interactive),
`ServiceWorkerRegister` (registers in prod, tears down any SW in dev).

## Support (`components/support/`)

`GoftinoChat` (loads Goftino, hides its launcher, fullscreen-on-open) and
`openSupportChat()` used by the header support button.

## Adding a component

1. Need it? Reuse a primitive first (`DESIGN.md` ladder).
2. Generic → `ui/`. Feature-specific → the feature folder.
3. Match token usage; no hard-coded hex/radius that a token covers.
4. Interactive → `"use client"` only on the leaf.
