# Account — Implementation flow

Product context: [`PRD.md`](./PRD.md).

## Flow

```
/account ── GetProfileUseCase ─▶ UserRepository.getProfile()
   ├─ ProfileHeader (avatar, name, phone, KYC chip → /kyc when unverified)
   ├─ AccountMenu (client leaf — support row opens Goftino)
   │     ├─ /account/two-step (+ /reset)      — TwoStepPasswordUseCase
   │     ├─ ThemeRow (inline, localStorage)   — doc/theme
   │     ├─ /account/announcements (+ /[id]) — ListAnnouncementsUseCase
   │     └─ /account/terms                    — static page
   └─ logout() ─▶ clears KYC cookie ─▶ redirect /
```

## File map

- Domain: `lib/core/domain/account/profile.ts`, `announcement.ts`,
  `two-step-password.ts` (rules, unit-tested).
- Ports: `user-repository.port.ts` (profile + two-step password),
  `announcements-repository.port.ts`; mocks in
  `lib/infrastructure/account/`.
- Actions: `app/actions/account.ts` (logout, setTwoStepPassword,
  resetTwoStepPassword) + `account-state.ts`.
- UI: `components/account/*` (`ProfileHeader`, `AccountMenu` + `Row`
  recipe, `TwoStepForm`, `ResetTwoStepForm`, `PasswordChecks`,
  `ThemeRow`), pages under `app/(platform)/account/**`.
- Version: `import pkg from "@/package.json"` (resolveJsonModule).

## Notes

- «KYC status reflected here» is mock-static until auth sessions exist
  (issue #3's last criterion) — the confirm action should write where
  `GetProfileUseCase` reads once a session lands.
