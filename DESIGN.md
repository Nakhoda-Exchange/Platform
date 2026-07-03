# DESIGN.md — Nakhoda design system

The visual + UX contract for Nakhoda (ناخدا). Keep code, Figma, and docs in
sync: tokens live in `app/globals.css` (`@theme`), this file explains them,
`COMPONENTS.md` covers the component catalog, and per-feature specs live under
`doc/<feature>/` (e.g. `doc/kyc/PRD.md` + `doc/kyc/flow.md`).

**Source of truth:** `app/globals.css` for token _values_, this file for _intent_.
Figma mirrors these values (the Figma file has no variables yet — raw values).

> Editing `@theme` tokens needs a dev-server restart — HMR ignores them.

## Foundations

Nakhoda is **mobile-first, RTL Persian**. `<html dir="rtl">`, Vazirmatn font.
Every screen must hold up on **mobile Safari (WebKit) and Chrome (Chromium)**.

**North-star:** the radical simplicity of our rival [Moonshot](https://moonshot.com/)
— one obvious action per screen, big/legible, nothing an elder has to puzzle
over. When copying a Moonshot pattern, keep it blue-only and RTL. The full voice

- visual rules live in the `nakhoda-ux` skill.

* **Language/direction:** Persian, right-to-left. Latin/number runs that must
  read left-to-right (OTP boxes, ticker symbols) get an explicit `dir="ltr"`.
* **Digits:** always Persian digits in UI copy. Convert with `lib/utils/digits.ts`
  — never hand-roll.

## Color

| Token         | Value                | Use                                         |
| ------------- | -------------------- | ------------------------------------------- |
| `brand`       | `#0023fb`            | Primary actions, logo, active states, links |
| `brand-soft`  | `rgba(0,35,251,.05)` | Icon-badge fill, subtle brand tint          |
| `ink`         | `#1a1b1e`            | Headings and primary text                   |
| `muted`       | `#696969`            | Secondary text, subtitles, captions         |
| `surface`     | `#f8f9fa`            | Input fill, inset panels                    |
| `line`        | `#f1f3f5`            | Hairline borders, dividers                  |
| `placeholder` | `#adb5bd`            | Input placeholder text                      |
| background    | `#ffffff`            | Page background                             |

**Semantic (not yet tokenized — use Tailwind reds/greens consistently):**

- Error: `red-400` border / `red-500` text.
- Market up: green; market down: red. Pills carry a soft tint of the same hue.

Contrast: `ink`/`muted` on white and `white` on `brand` all pass WCAG AA. Never
put `muted` on `surface` for body text, and never `placeholder` as real content.

## Typography

Font: **Vazirmatn** (`--font-sans`, wired in the root layout).

| Role                      | Size / weight                      | Notes                |
| ------------------------- | ---------------------------------- | -------------------- |
| Page title (`PageHeader`) | 28px / extrabold, 36px ≥sm         | RTL, right-aligned   |
| Card / screen heading     | 24–28px / extrabold                | e.g. "ورود به ناخدا" |
| Body                      | 16px / normal, line-height 1.6–1.7 |                      |
| Label                     | 13px / semibold, `ink`             | Field labels         |
| Subtitle / caption        | 13–16px / normal, `muted`          |                      |
| Button                    | 13–16px / **bold**                 | scales with size     |

Weight ladder: normal → semibold (labels) → bold (buttons) → extrabold (headings).

## Spacing, radii, layout

- **Spacing:** Tailwind 4px scale. Screen gutter **20–24px** (`px-5`/`px-6`).
  Vertical rhythm between blocks **gap-10 (40px)** on auth, tighter inside groups.
- **Radii:** `--radius-field` 12px (inputs, badges, small tiles),
  `--radius-card` 20px (cards, sheets). Buttons: **pill** (`rounded-full`) is the
  default CTA; `rounded` (14px) for inline/secondary.
- **Content width:** `--container-page` 1200px desktop. Auth/forms cap at **420px**.
- **Mobile frame:** 390×844 (iPhone), iOS status bar at top, 800px content area.
- **Touch targets:** ≥44px. Primary buttons are 56px (`h-14`) on mobile forms.

## Components (recipes)

Full catalog in `COMPONENTS.md`. Rules:

- **One `Button`** (`components/ui/button.tsx`) — `variant` (primary/ghost),
  `size` (sm/md/lg/xl), `shape` (pill/rounded), `fullWidth`. To style a `Link`
  as a button, use `buttonClasses()`; don't fork the styles.
- **Field** — labelled input, 12px radius, `surface` fill, `line` border,
  `brand` focus ring, red error state. Reuse for every text input.
- **Card** — 20px radius, hairline `line` border, white fill.
- **IconBadge** — 48px `brand-soft` square, 12px radius, houses a `brand` icon.
- **Icons** — inline SVG (`components/ui/icons.tsx`), `stroke="currentColor"`,
  2px stroke, round caps. Recolor with `text-*`. Never import an icon font.
- **Logo** — the single `Logo` (`components/layout/logo.tsx`): wordmark "ناخدا"
  in `brand` extrabold + anchor mark in a filled `brand` tile. One logo
  everywhere; there is no separate auth/ship-wheel variant anymore.
- **Platform shell** — sticky `PlatformHeader` (logo or per-route title + a
  support action) and a **floating** `BottomNav` (rounded card, shadow, brand-tint
  active pill, iOS safe-area). Both RTL; nav order is right→left.
- **Market row** — coin badge (brand letter, blue-only), name/symbol, price
  (IRT + USD), and a green/red change pill that always pairs color with ▲/▼.
- **Splash** — full-screen `brand` overlay with the white anchor + spinner,
  shown on load (web + PWA) and matched to the PWA manifest `background_color`.

## Interaction & states

- Every interactive element needs hover, active, focus-visible (`ring-brand/40`),
  and disabled states. Primary disabled = `slate-200` fill / `slate-400` text.
- Buttons that trigger async work show a pending state and disable to prevent
  double-submit (see the OTP/login flow).
- Errors render inline under the field, never as a bare alert.

## Accessibility baseline (non-negotiable)

- Label every input (`Field` wires `htmlFor`/`id`); `aria-invalid` on error.
- Icons decorative → `aria-hidden`; meaningful → give an `aria-label`.
- Maintain a visible focus ring. Don't remove outlines without a replacement.
- Respect `dir` — mirror layout, not glyphs.

## RTL gotchas

- In an RTL container `items-start` aligns **right**. Force `dir="ltr"` on
  subtrees that must flow LTR (OTP boxes, ticker symbols, the feature grid).
- Chevrons/arrows point the RTL way (back = pointing right).
