# Theme — Implementation flow

Product context: [`PRD.md`](./PRD.md).

## Flow

```
first paint:  <body> inline script (THEME_INIT_SCRIPT)
   localStorage("theme") ─ dark/light ─▶ toggle .dark on <html>
   └─ unset ─▶ prefers-color-scheme decides
runtime:      ThemeWatcher follows OS changes while no override is stored
account:      ThemeRow (سیستم/روشن/تیره) ─▶ applyThemePref
   └─ writes localStorage + toggles .dark instantly
css:          @theme inline → --tone-* palette; `.dark` swaps it wholesale
```

## File map

- Tokens + palettes: `app/globals.css` (`@theme inline`, `:root` /`.dark`
  `--tone-*` sets, `@custom-variant dark`).
- Logic: `lib/utils/theme.ts` (`getThemePref`, `applyThemePref`,
  `THEME_INIT_SCRIPT` — single source for the pre-paint script).
- Mount: `app/layout.tsx` (script as first body element + `ThemeWatcher`).
- Picker: `components/account/theme-row.tsx`.

## Notes

- `@theme` token edits need a dev-server restart (HMR ignores them).
- `color-scheme` is set per palette so native controls/scrollbars match.
