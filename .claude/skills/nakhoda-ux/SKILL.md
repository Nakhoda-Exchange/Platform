---
name: nakhoda-ux
description: >
  Design + Persian UX-writing guidelines for the Nakhoda altcoin platform. Load
  BEFORE building or restyling any page, screen, component, or writing any
  user-facing copy (buttons, labels, errors, empty states, toasts). Enforces:
  blue-only palette with a minimal sea-wave motif, simple/minimal/readable
  screens an elderly user can operate, and one voice that reads naturally to
  both a 65-year-old and a Gen-Z user at once. RTL Persian.
---

Nakhoda (ناخدا, "sea captain") is a mobile-first RTL Persian altcoin platform.
Audience is **everyone** — a 68-year-old first-time crypto buyer AND a 22-year-old.
Every screen must work for the elder without boring the youth. When those two
pull apart, **the elder wins**: clarity beats cleverness.

## The one rule

If your grandparent can't finish the task without asking a question, the screen
is wrong. Fewer choices, bigger targets, plainer words.

## Visual design

- **Blue only.** Brand is `--color-brand` (`#0023fb`). Use `text-brand` /
  `bg-brand` / `bg-brand-soft`. Neutrals (`ink`, `muted`, `surface`, `line`)
  for everything else. No greens/reds/purples for decoration — reserve any
  non-blue strictly for a real state (a validation error). Gains/losses may use
  semantic color, but that is data, not decoration.
- **Sea wave, minimal.** The wave motif is the existing `<Waves>` component
  (`components/landing/waves.tsx`) — reuse it, don't draw new SVGs. Default
  `opacity ≈ 0.04`, behind content, `aria-hidden`, `pointer-events-none`. One
  quiet wave per screen at most. It's a whisper of the sea, never a background
  pattern that competes with text.
- **One screen, one job.** A single primary action per view. Everything else is
  secondary or gone. Whitespace is a feature, not wasted space.
- **Big and legible.** Body text ≥ 16px, generous line-height, tap targets
  ≥ 44px. Vazirmatn is already wired (`--font-sans`). Radii from tokens
  (`rounded-field` 12px, `rounded-card` 20px). Don't shrink text to fit — cut
  the text.
- **Contrast.** Real contrast on `ink`/`muted` over white/`surface`. Never put
  meaning on color alone (elders + colorblind) — pair it with a word or icon.
- **RTL.** See CLAUDE.md RTL notes. `dir="ltr"` only on genuinely LTR subtrees
  (OTP boxes, numeric fields). Persian digits via `lib/utils/digits.ts`, never
  hand-rolled.

## UX writing — the dual voice

Write **short, warm, plain Persian**. The trick to hitting elder + Gen-Z at
once: use everyday words both already know, and cut everything else. Slang ages
you out of the elder; jargon ages you out of the youth. Plain speech hits both.

- **Verbs, not nouns.** «رمز را وارد کنید» not «جهت احراز هویت، اقدام به ورود رمز نمایید».
- **You, directly.** Address the user («شماره‌ات را وارد کن» / «وارد کنید» — pick
  one politeness level per app and keep it; Nakhoda uses respectful-but-warm).
- **No English, no crypto jargon** on the surface. «کیف پول» not «wallet»,
  «رمز یک‌بارمصرف» not «OTP» in body copy (short labels may abbreviate).
- **Say what happens next.** Every button names its outcome: «ورود» → «ادامه» →
  «تأیید». The user always knows where the tap leads.
- **Errors help, don't scold.** State the problem + the fix, calmly. Not «خطا».
  Yes: «شماره موبایل درست نیست. با ۰۹ شروع کن.»
- **Numbers stay clear.** Persian digits, thousands separators, currency spelled
  «تومان». No ambiguous truncation of money.

Voice test — does it read fine said aloud to a parent AND texted to a friend?

- ❌ too stiff: «عملیات احراز هویت با موفقیت به انجام رسید.»
- ❌ too slang: «آیدیت وریفای شد 🎉»
- ✅ both: «هویتت تأیید شد.»

## Before you ship a screen — checklist

- [ ] One primary action, obvious at a glance.
- [ ] All copy plain Persian, verbs-first, no jargon/English.
- [ ] Every button/error says what happens next / how to fix.
- [ ] Blue + neutrals only; any other color earns its place as a real state.
- [ ] At most one faint `<Waves>`, decorative + `aria-hidden`.
- [ ] Text ≥ 16px, tap targets ≥ 44px, real contrast.
- [ ] Could an elder finish this without asking? If not, simplify.
- [ ] Verified in **WebKit + Chromium** (see CLAUDE.md), not Chrome alone.
