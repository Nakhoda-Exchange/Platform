# Theme (حالت نمایش) — Product Requirements (PRD)

## Summary

Light and dark, without ceremony: the app follows the OS by default, the
user can override (سیستم / روشن / تیره) from حساب کاربری, and the choice
persists on the device. No flash of the wrong theme, ever.

## Goals

- System default; override persisted in `localStorage`; live OS-follow while
  no override is set.
- The blue-only identity survives dark mode: brand stays `#0023fb`, coin
  logos stay real, gain/loss data colors adapt for contrast
  (green-700/red-700 → green-400/red-400).
- Zero per-screen work: every token-based color follows the theme.

## Non-goals

- Per-screen themes, scheduled switching, high-contrast mode (tracked
  separately if needed).

## Rules for contributors

Never hardcode neutrals (`bg-white`, `gray-*`, `slate-*`) or raw green/red.
Use the tokens: `paper` (page/card bg), `ink`, `muted`, `surface`, `line`,
`placeholder`, and `gain`/`loss` (+`-soft`). Exception: QR containers stay
`bg-white` for scan contrast.
